import pytest
from backend.app.schemas.schemas import ReconciliationResultSchema, GroundTruthSchema
from backend.app.services.evaluation.evaluator import Evaluator

def test_evaluation_metrics():
    preds = [
        ReconciliationResultSchema(
            transaction_id="TXN-101", invoice_id="INV-2026-001", customer_name="Acme",
            amount=5000.0, currency="USD", transaction_date="2026-08-10", match_type="exact",
            confidence=1.0, confidence_level="HIGH", payment_status="on_time", days_late=0,
            is_duplicate=False, action="AUTO_RECONCILE"
        ),
        ReconciliationResultSchema(
            transaction_id="TXN-103", invoice_id="INV-2026-003", customer_name="Gamma",
            amount=3400.0, currency="USD", transaction_date="2026-08-18", match_type="partial",
            confidence=0.85, confidence_level="HIGH", payment_status="on_time", days_late=0,
            is_duplicate=False, action="AUTO_RECONCILE"
        )
    ]
    gt = [
        GroundTruthSchema(transaction_id="TXN-101", invoice_id="INV-2026-001", match_type="exact", payment_status="on_time", is_duplicate=False),
        GroundTruthSchema(transaction_id="TXN-103", invoice_id="INV-2026-003", match_type="partial", payment_status="on_time", is_duplicate=False)
    ]

    report = Evaluator.evaluate(preds, gt)
    assert report.overall_accuracy == 1.0
    assert report.overall_f1 == 1.0
    assert "exact" in report.category_metrics
    assert "partial" in report.category_metrics
