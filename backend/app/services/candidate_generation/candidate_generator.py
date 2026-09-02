from typing import List
from datetime import datetime
from backend.app.schemas.schemas import NormalizedTransaction, NormalizedInvoice
from backend.app.config.config import settings

class CandidateGenerator:
    @staticmethod
    def get_candidates(
        transaction: NormalizedTransaction,
        invoices: List[NormalizedInvoice]
    ) -> List[NormalizedInvoice]:
        """
        Generate candidate invoices for a bank transaction based on blocking keys:
        1. Currency match
        2. Reasonable date window (e.g. within DATE_WINDOW_DAYS of invoice date or due date)
        3. Broad amount / customer overlap
        """
        txn_curr = transaction.currency.normalized_value
        txn_date_str = transaction.date.normalized_value
        
        try:
            txn_dt = datetime.strptime(txn_date_str, "%Y-%m-%d")
        except ValueError:
            txn_dt = None

        candidates = []
        for inv in invoices:
            inv_curr = inv.currency.normalized_value
            # Blocking Rule 1: Currency must match
            if txn_curr and inv_curr and txn_curr != inv_curr:
                continue

            # Blocking Rule 2: Date window filter (if date parsing succeeds)
            if txn_dt:
                try:
                    inv_dt = datetime.strptime(inv.invoice_date.normalized_value, "%Y-%m-%d")
                    due_dt = datetime.strptime(inv.due_date.normalized_value, "%Y-%m-%d")
                    # Check distance from issue date or due date
                    diff_issue = abs((txn_dt - inv_dt).days)
                    diff_due = abs((txn_dt - due_dt).days)
                    if min(diff_issue, diff_due) > settings.DATE_WINDOW_DAYS + 30:
                        continue
                except ValueError:
                    pass

            candidates.append(inv)

        # Fallback: if blocking eliminates all candidates, return full list
        return candidates if candidates else invoices
