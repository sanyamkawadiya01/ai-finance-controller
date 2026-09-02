import pytest
from backend.app.schemas.schemas import BankTransactionSchema, InvoiceSchema
from backend.app.services.normalization.normalizer import Normalizer
from backend.app.services.exact_matching.exact_matcher import ExactMatcher

def test_exact_matcher_success():
    txn = Normalizer.normalize_transaction(BankTransactionSchema(
        transaction_id="TXN-101",
        transaction_date="2026-08-10",
        description="WIRE TRANSFER FROM ACME CORP INV-2026-001",
        customer_name="Acme Corporation",
        reference="INV-2026-001",
        amount=5000.00,
        currency="USD"
    ))
    inv = Normalizer.normalize_invoice(InvoiceSchema(
        invoice_id="INV-2026-001",
        customer_id="CUST-101",
        customer_name="Acme Corporation",
        invoice_date="2026-08-01",
        due_date="2026-08-15",
        invoice_amount=5000.00,
        currency="USD"
    ))
    res = ExactMatcher.match_transaction(txn, [inv])
    assert res is not None
    assert res.match_type == "exact"
    assert res.confidence == 1.0
    assert res.invoice_id == "INV-2026-001"

def test_exact_matcher_wrong_amount():
    txn = Normalizer.normalize_transaction(BankTransactionSchema(
        transaction_id="TXN-104",
        transaction_date="2026-08-14",
        description="WIRE TRANS DELTA ENT INV-2026-004 LESS FEE",
        customer_name="Delta Ent.",
        reference="INV-2026-004",
        amount=8890.00,  # Invoice amount is 8900.00
        currency="USD"
    ))
    inv = Normalizer.normalize_invoice(InvoiceSchema(
        invoice_id="INV-2026-004",
        customer_id="CUST-104",
        customer_name="Delta Enterprises",
        invoice_date="2026-08-02",
        due_date="2026-08-16",
        invoice_amount=8900.00,
        currency="USD"
    ))
    res = ExactMatcher.match_transaction(txn, [inv])
    assert res is None  # Should fail exact matcher due to amount difference
