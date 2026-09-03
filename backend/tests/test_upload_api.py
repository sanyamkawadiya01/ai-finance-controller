import io
import pytest
from fastapi.testclient import TestClient
from backend.app.api.main import app

client = TestClient(app)

def test_get_dataset_status():
    client.post("/api/dataset/clear")
    res = client.get("/api/dataset/status")
    assert res.status_code == 200
    data = res.json()
    assert "active" in data
    assert "source" in data
    assert data["invoices_count"] == 0
    assert data["transactions_count"] == 0

def test_upload_valid_custom_dataset():
    inv_csv = (
        "invoice_id,customer_id,customer_name,invoice_date,due_date,invoice_amount,currency\n"
        "INV-TEST-01,C-01,Alpha Corp,2026-08-01,2026-08-15,1500.00,USD\n"
        "INV-TEST-02,C-02,Beta LLC,2026-08-02,2026-08-16,2500.00,USD\n"
    )
    txn_csv = (
        "transaction_id,transaction_date,description,customer_name,reference,amount,currency\n"
        "TXN-TEST-01,2026-08-10,WIRE FROM ALPHA CORP INV-TEST-01,Alpha Corp,INV-TEST-01,1500.00,USD\n"
        "TXN-TEST-02,2026-08-12,ACH BETA LLC INV-TEST-02,Beta LLC,INV-TEST-02,2500.00,USD\n"
    )
    gt_csv = (
        "transaction_id,invoice_id,match_type,payment_status,is_duplicate\n"
        "TXN-TEST-01,INV-TEST-01,exact,on_time,false\n"
        "TXN-TEST-02,INV-TEST-02,exact,on_time,false\n"
    )

    response = client.post(
        "/api/dataset/upload",
        files={
            "invoices_file": ("invoices.csv", io.BytesIO(inv_csv.encode("utf-8")), "text/csv"),
            "transactions_file": ("transactions.csv", io.BytesIO(txn_csv.encode("utf-8")), "text/csv"),
            "ground_truth_file": ("ground_truth.csv", io.BytesIO(gt_csv.encode("utf-8")), "text/csv"),
        }
    )

    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True
    assert res_data["invoices_count"] == 2
    assert res_data["transactions_count"] == 2
    assert res_data["ground_truth_count"] == 2

    # Verify reconciliation table uses uploaded dataset dynamically
    results_res = client.get("/api/reconciliation-results")
    assert results_res.status_code == 200
    results_data = results_res.json()
    assert len(results_data) == 2
    assert results_data[0]["transaction_id"] == "TXN-TEST-01"

    # Reset dataset back to default
    reset_res = client.post("/api/dataset/reset")
    assert reset_res.status_code == 200
    assert reset_res.json()["source"] in ["none", "default"]

def test_upload_invalid_csv_returns_errors():
    invalid_inv_csv = (
        "invoice_id,customer_name\n"
        "INV-01,Missing Columns\n"
    )
    txn_csv = (
        "transaction_id,transaction_date,description,customer_name,reference,amount,currency\n"
        "TXN-01,2026-08-10,WIRE,Acme,,100.0,USD\n"
    )

    response = client.post(
        "/api/dataset/upload",
        files={
            "invoices_file": ("invoices.csv", io.BytesIO(invalid_inv_csv.encode("utf-8")), "text/csv"),
            "transactions_file": ("transactions.csv", io.BytesIO(txn_csv.encode("utf-8")), "text/csv"),
        }
    )

    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is False
    assert len(res_data["errors"]) > 0
