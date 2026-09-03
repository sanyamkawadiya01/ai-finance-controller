import os
import pandas as pd
import pytest

@pytest.fixture
def temp_dataset(tmp_path):
    inv_content = (
        "invoice_id,customer_id,customer_name,invoice_date,due_date,invoice_amount,currency\n"
        "INV-01,C-01,Alpha Corp,2026-08-01,2026-08-15,1500.00,USD\n"
        "INV-02,C-02,Beta LLC,2026-08-02,2026-08-16,2500.00,USD\n"
    )
    txn_content = (
        "transaction_id,transaction_date,description,customer_name,reference,amount,currency\n"
        "TXN-01,2026-08-10,WIRE FROM ALPHA CORP INV-01,Alpha Corp,INV-01,1500.00,USD\n"
        "TXN-02,2026-08-12,ACH BETA LLC INV-02,Beta LLC,INV-02,2500.00,USD\n"
    )
    gt_content = (
        "transaction_id,invoice_id,match_type,payment_status,is_duplicate\n"
        "TXN-01,INV-01,exact,on_time,false\n"
        "TXN-02,INV-02,exact,on_time,false\n"
    )
    
    inv_file = tmp_path / "invoices.csv"
    txn_file = tmp_path / "bank_transactions.csv"
    gt_file = tmp_path / "ground_truth.csv"

    inv_file.write_text(inv_content, encoding="utf-8")
    txn_file.write_text(txn_content, encoding="utf-8")
    gt_file.write_text(gt_content, encoding="utf-8")

    return str(tmp_path)

def test_temp_dataset_counts(temp_dataset):
    df_inv = pd.read_csv(os.path.join(temp_dataset, "invoices.csv")).fillna("")
    df_txn = pd.read_csv(os.path.join(temp_dataset, "bank_transactions.csv")).fillna("")
    df_gt = pd.read_csv(os.path.join(temp_dataset, "ground_truth.csv")).fillna("")

    assert len(df_inv) == 2
    assert len(df_txn) == 2
    assert len(df_gt) == 2

def test_temp_dataset_unique_ids(temp_dataset):
    df_inv = pd.read_csv(os.path.join(temp_dataset, "invoices.csv"))
    df_txn = pd.read_csv(os.path.join(temp_dataset, "bank_transactions.csv"))
    df_gt = pd.read_csv(os.path.join(temp_dataset, "ground_truth.csv"))

    assert df_inv["invoice_id"].nunique() == 2
    assert df_txn["transaction_id"].nunique() == 2
    assert df_gt["transaction_id"].nunique() == 2

def test_ground_truth_references_valid_records(temp_dataset):
    df_inv = pd.read_csv(os.path.join(temp_dataset, "invoices.csv")).fillna("")
    df_txn = pd.read_csv(os.path.join(temp_dataset, "bank_transactions.csv")).fillna("")
    df_gt = pd.read_csv(os.path.join(temp_dataset, "ground_truth.csv")).fillna("")

    valid_inv_ids = set(df_inv["invoice_id"].astype(str))
    valid_txn_ids = set(df_txn["transaction_id"].astype(str))

    for _, row in df_gt.iterrows():
        txn_id = str(row["transaction_id"])
        inv_id = str(row["invoice_id"]).strip()

        assert txn_id in valid_txn_ids
        if inv_id:
            assert inv_id in valid_inv_ids
