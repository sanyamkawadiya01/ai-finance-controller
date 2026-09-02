import pytest
from backend.app.schemas.schemas import BankTransactionSchema, InvoiceSchema
from backend.app.services.normalization.normalizer import Normalizer
from backend.app.services.fuzzy_matching.fuzzy_matcher import FuzzyMatcher

def test_fuzzy_matcher_spelling_variation():
    txn = Normalizer.normalize_transaction(BankTransactionSchema(
        transaction_id="TXN-103",
        transaction_date="2026-08-18",
        description="INWARD REMITTANCE GAMMA TECH PVT LTD",
        customer_name="GAMMA TECH PVT LTD",
        reference="",
        amount=3400.00,
        currency="USD"
    ))
    inv = Normalizer.normalize_invoice(InvoiceSchema(
        invoice_id="INV-2026-003",
        customer_id="CUST-103",
        customer_name="Gamma Tech Pvt Ltd",
        invoice_date="2026-08-05",
        due_date="2026-08-20",
        invoice_amount=3400.00,
        currency="USD"
    ))
    res = FuzzyMatcher.match_transaction(txn, [inv])
    assert res is not None
    assert res.match_type == "partial"
    assert res.confidence >= 0.70
    assert res.invoice_id == "INV-2026-003"

def test_fuzzy_matcher_slight_amount_variation():
    txn = Normalizer.normalize_transaction(BankTransactionSchema(
        transaction_id="TXN-104",
        transaction_date="2026-08-14",
        description="WIRE TRANS DELTA ENT INV-2026-004 LESS FEE",
        customer_name="Delta Ent.",
        reference="INV-2026-004",
        amount=8890.00,
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
    res = FuzzyMatcher.match_transaction(txn, [inv])
    assert res is not None
    assert res.confidence >= 0.80
    assert res.invoice_id == "INV-2026-004"
