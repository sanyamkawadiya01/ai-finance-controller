import pytest
from backend.app.services.normalization.normalizer import Normalizer
from backend.app.schemas.schemas import BankTransactionSchema

def test_customer_name_normalization():
    assert Normalizer.normalize_customer_name("ABC Pvt. Ltd.") == "abc"
    assert Normalizer.normalize_customer_name("Acme Corporation Inc.") == "acme"
    assert Normalizer.normalize_customer_name("Beta Logistics LLC") == "beta logistics"

def test_reference_extraction():
    assert Normalizer.extract_invoice_reference("WIRE TRANSFER INV-2026-001") == "INV-2026-001"
    assert Normalizer.extract_invoice_reference("Payment for INV2026005") == "INV-2026-005"
    assert Normalizer.extract_invoice_reference("INV/2026/013") == "INV-2026-013"

def test_currency_and_amount_normalization():
    assert Normalizer.normalize_currency("$") == "USD"
    assert Normalizer.normalize_currency("eur") == "EUR"
    assert Normalizer.normalize_amount("$5,000.00") == 5000.00
    assert Normalizer.normalize_amount(1250.5) == 1250.50

def test_dual_representation():
    txn = BankTransactionSchema(
        transaction_id="TXN-101",
        transaction_date="2026-08-10",
        description="WIRE TRANSFER FROM ACME CORP INV-2026-001",
        customer_name="Acme Corporation",
        reference="INV-2026-001",
        amount=5000.00,
        currency="USD"
    )
    norm = Normalizer.normalize_transaction(txn)
    assert norm.customer_name.original_value == "Acme Corporation"
    assert norm.customer_name.normalized_value == "acme"
    assert norm.reference.normalized_value == "INV-2026-001"
