import pytest
from backend.app.services.payment_status.payment_calculator import PaymentCalculator

def test_payment_status_on_time():
    status, days_late = PaymentCalculator.calculate_matched_status("2026-08-10", "2026-08-15")
    assert status == "on_time"
    assert days_late == 0

def test_payment_status_late():
    status, days_late = PaymentCalculator.calculate_matched_status("2026-08-20", "2026-08-15")
    assert status == "late"
    assert days_late == 5

def test_payment_status_unpaid_overdue():
    status, days_overdue = PaymentCalculator.calculate_unpaid_status("2026-07-15", "2026-09-01")
    assert status == "overdue"
    assert days_overdue == 48

def test_payment_status_unpaid_future():
    status, days_overdue = PaymentCalculator.calculate_unpaid_status("2026-09-10", "2026-09-01")
    assert status == "unpaid"
    assert days_overdue == 0
