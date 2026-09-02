from datetime import datetime
from typing import Tuple, Dict, Any, List
from backend.app.schemas.schemas import NormalizedInvoice, ReconciliationResultSchema
from backend.app.config.config import settings

class PaymentCalculator:
    @staticmethod
    def calculate_matched_status(payment_date_str: str, due_date_str: str) -> Tuple[str, int]:
        """
        Calculate payment status for a matched transaction:
        - payment_date <= due_date -> on_time
        - payment_date > due_date -> late (days_late = payment_date - due_date)
        """
        try:
            p_dt = datetime.strptime(payment_date_str, "%Y-%m-%d")
            d_dt = datetime.strptime(due_date_str, "%Y-%m-%d")
            if p_dt <= d_dt:
                return "on_time", 0
            else:
                days_late = (p_dt - d_dt).days
                return "late", days_late
        except Exception:
            return "on_time", 0

    @staticmethod
    def calculate_unpaid_status(due_date_str: str, reference_date_str: str = None) -> Tuple[str, int]:
        """
        Calculate payment status for an unpaid invoice:
        - reference_date > due_date -> overdue (days_late = reference_date - due_date)
        - reference_date <= due_date -> unpaid
        """
        ref_date_str = reference_date_str or settings.REFERENCE_DATE
        try:
            d_dt = datetime.strptime(due_date_str, "%Y-%m-%d")
            r_dt = datetime.strptime(ref_date_str, "%Y-%m-%d")
            if r_dt > d_dt:
                return "overdue", (r_dt - d_dt).days
            else:
                return "unpaid", 0
        except Exception:
            return "unpaid", 0
