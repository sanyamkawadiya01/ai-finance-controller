import pytest
from backend.app.schemas.schemas import ReconciliationResultSchema
from backend.app.services.duplicate_detection.duplicate_detector import DuplicateDetector

def test_duplicate_detection():
    res1 = ReconciliationResultSchema(
        transaction_id="TXN-106",
        invoice_id="INV-2026-006",
        customer_name="Zeta Retail Systems",
        amount=4500.00,
        currency="USD",
        transaction_date="2026-08-20",
        match_type="exact",
        confidence=1.0,
        confidence_level="HIGH",
        payment_status="on_time",
        days_late=0,
        is_duplicate=False,
        action="AUTO_RECONCILE"
    )
    res2 = ReconciliationResultSchema(
        transaction_id="TXN-107",
        invoice_id="INV-2026-006",
        customer_name="Zeta Retail Systems",
        amount=4500.00,
        currency="USD",
        transaction_date="2026-08-22",
        match_type="exact",
        confidence=1.0,
        confidence_level="HIGH",
        payment_status="on_time",
        days_late=0,
        is_duplicate=False,
        action="AUTO_RECONCILE"
    )
    results = DuplicateDetector.detect_duplicates([res1, res2])
    assert results[0].is_duplicate is False
    assert results[1].is_duplicate is True
    assert results[1].match_type == "duplicate"
    assert results[1].action == "HUMAN_REVIEW"
