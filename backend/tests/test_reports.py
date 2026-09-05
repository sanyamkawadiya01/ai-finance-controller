import io
import pytest
from fastapi.testclient import TestClient
from backend.app.api.main import app

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_test_dataset():
    inv_csv = (
        "invoice_id,customer_id,customer_name,invoice_date,due_date,invoice_amount,currency\n"
        "INV-RPT-01,C-01,Alpha Corp,2026-08-01,2026-08-15,1500.00,USD\n"
        "INV-RPT-02,C-02,Beta LLC,2026-08-02,2026-08-16,2500.00,USD\n"
    )
    txn_csv = (
        "transaction_id,transaction_date,description,customer_name,reference,amount,currency\n"
        "TXN-RPT-01,2026-08-10,WIRE FROM ALPHA CORP INV-RPT-01,Alpha Corp,INV-RPT-01,1500.00,USD\n"
        "TXN-RPT-02,2026-08-12,ACH BETA LLC INV-RPT-02,Beta LLC,INV-RPT-02,2500.00,USD\n"
    )
    gt_csv = (
        "transaction_id,invoice_id,match_type,payment_status,is_duplicate\n"
        "TXN-RPT-01,INV-RPT-01,exact,on_time,false\n"
        "TXN-RPT-02,INV-RPT-02,exact,on_time,false\n"
    )

    client.post(
        "/api/dataset/upload",
        files={
            "invoices_file": ("invoices.csv", io.BytesIO(inv_csv.encode("utf-8")), "text/csv"),
            "transactions_file": ("transactions.csv", io.BytesIO(txn_csv.encode("utf-8")), "text/csv"),
            "ground_truth_file": ("ground_truth.csv", io.BytesIO(gt_csv.encode("utf-8")), "text/csv"),
        }
    )
    yield
    client.post("/api/dataset/clear")


def test_pdf_report_endpoint():
    response = client.post("/api/reports/pdf")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "attachment; filename=" in response.headers.get("content-disposition", "")
    assert response.content.startswith(b"%PDF-")


def test_excel_report_endpoint():
    response = client.post("/api/reports/excel")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    assert "attachment; filename=" in response.headers.get("content-disposition", "")
    assert response.content.startswith(b"PK")


def test_report_generation_with_human_override():
    # Submit human review
    review_resp = client.post(
        "/api/review/TXN-RPT-01",
        json={"status": "ACCEPT", "reviewer_notes": "Unit test override"}
    )
    assert review_resp.status_code == 200

    # Generate PDF and Excel after override
    pdf_resp = client.post("/api/reports/pdf")
    assert pdf_resp.status_code == 200
    assert pdf_resp.content.startswith(b"%PDF-")

    excel_resp = client.post("/api/reports/excel")
    assert excel_resp.status_code == 200
    assert excel_resp.content.startswith(b"PK")


def test_reports_empty_dataset_error():
    client.post("/api/dataset/clear")

    pdf_resp = client.post("/api/reports/pdf")
    assert pdf_resp.status_code == 400
    assert "No active dataset found" in pdf_resp.json()["detail"]

    excel_resp = client.post("/api/reports/excel")
    assert excel_resp.status_code == 400
    assert "No active dataset found" in excel_resp.json()["detail"]
