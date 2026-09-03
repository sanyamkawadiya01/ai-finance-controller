import pandas as pd
import pytest
from backend.app.services.validation.validator import DatasetValidator

def test_validate_invoices_valid():
    data = {
        "invoice_id": ["INV-001", "INV-002"],
        "customer_id": ["C1", "C2"],
        "customer_name": ["Acme Corp", "Beta LLC"],
        "invoice_date": ["2026-08-01", "2026-08-05"],
        "due_date": ["2026-08-15", "2026-08-20"],
        "invoice_amount": [1000.0, 500.50],
        "currency": ["USD", "EUR"]
    }
    df = pd.DataFrame(data)
    errors, warnings = DatasetValidator.validate_invoices_df(df)
    assert len(errors) == 0

def test_validate_invoices_missing_columns():
    data = {
        "invoice_id": ["INV-001"],
        "customer_name": ["Acme Corp"]
    }
    df = pd.DataFrame(data)
    errors, warnings = DatasetValidator.validate_invoices_df(df)
    assert len(errors) > 0
    assert "missing required column" in errors[0]

def test_validate_invoices_invalid_date_and_amount():
    data = {
        "invoice_id": ["INV-001"],
        "customer_id": ["C1"],
        "customer_name": ["Acme Corp"],
        "invoice_date": ["invalid-date"],
        "due_date": ["2026-08-15"],
        "invoice_amount": ["not-a-number"],
        "currency": ["USD"]
    }
    df = pd.DataFrame(data)
    errors, warnings = DatasetValidator.validate_invoices_df(df)
    assert len(errors) >= 2

def test_validate_transactions_duplicate_id():
    data = {
        "transaction_id": ["TXN-001", "TXN-001"],
        "transaction_date": ["2026-08-10", "2026-08-11"],
        "description": ["WIRE 1", "WIRE 2"],
        "customer_name": ["Acme", "Acme"],
        "reference": ["INV-001", "INV-001"],
        "amount": [1000.0, 1000.0],
        "currency": ["USD", "USD"]
    }
    df = pd.DataFrame(data)
    errors, warnings = DatasetValidator.validate_transactions_df(df)
    assert any("Duplicate transaction_id" in err for err in errors)

def test_validate_ground_truth_invalid_references():
    data = {
        "transaction_id": ["TXN-999"],
        "invoice_id": ["INV-999"],
        "match_type": "invalid_type",
        "payment_status": "on_time",
        "is_duplicate": [False]
    }
    df = pd.DataFrame(data)
    errors, warnings = DatasetValidator.validate_ground_truth_df(df, valid_txn_ids={"TXN-001"}, valid_inv_ids={"INV-001"})
    assert len(errors) >= 3
