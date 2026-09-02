from typing import Optional, List, Tuple
from datetime import datetime
from backend.app.schemas.schemas import NormalizedTransaction, NormalizedInvoice, ReconciliationResultSchema, FeatureBreakdown

class ExactMatcher:
    @staticmethod
    def match_transaction(
        txn: NormalizedTransaction,
        candidates: List[NormalizedInvoice]
    ) -> Optional[ReconciliationResultSchema]:
        """
        Stage 1 Exact Matching Engine.
        Deterministic rules:
        - Invoice reference matches transaction reference or description
        - Exact amount match
        - Currency match
        - Reasonable date relationship
        """
        txn_ref = txn.reference.normalized_value
        txn_amount = txn.amount.normalized_value
        txn_currency = txn.currency.normalized_value
        txn_customer = txn.customer_name.normalized_value

        for inv in candidates:
            inv_id_norm = inv.invoice_id.upper().strip()
            inv_amount = inv.amount.normalized_value
            inv_currency = inv.currency.normalized_value
            inv_customer = inv.customer_name.normalized_value

            reasons = []

            # Rule 1: Reference Match (Transaction reference or description contains normalized invoice ID)
            ref_matched = False
            if txn_ref and (txn_ref == inv_id_norm or inv_id_norm in txn_ref):
                ref_matched = True
                reasons.append(f"Invoice reference '{inv_id_norm}' explicitly matched in transaction reference")

            # Rule 2: Exact Amount Match
            amount_matched = abs(txn_amount - inv_amount) < 0.001
            if amount_matched:
                reasons.append(f"Exact amount matched ({txn_currency} {txn_amount:.2f})")

            # Rule 3: Currency Match
            currency_matched = (txn_currency == inv_currency)
            if currency_matched:
                reasons.append(f"Currency matched ({txn_currency})")

            # Rule 4: Customer Name Match (exact core name match)
            customer_matched = False
            if txn_customer and inv_customer and (txn_customer in inv_customer or inv_customer in txn_customer):
                customer_matched = True
                reasons.append(f"Customer name matched ('{txn.customer_name.original_value}')")

            # Rule 5: Date relationship validation
            date_valid = True
            try:
                t_dt = datetime.strptime(txn.date.normalized_value, "%Y-%m-%d")
                i_dt = datetime.strptime(inv.invoice_date.normalized_value, "%Y-%m-%d")
                if t_dt < i_dt:
                    date_valid = False
            except Exception:
                pass

            if date_valid:
                reasons.append("Transaction date is on or after invoice issue date")

            # Deterministic criteria for Stage 1 EXACT MATCH:
            # Condition A: Reference matched AND Amount matched AND Currency matched AND Date valid
            # Condition B: Customer matched AND Exact Amount matched AND Currency matched AND Date valid
            if currency_matched and date_valid:
                if (ref_matched and amount_matched) or (customer_matched and amount_matched and ref_matched):
                    feature_breakdown = FeatureBreakdown(
                        amount_similarity=1.0,
                        customer_name_similarity=1.0 if customer_matched else 0.9,
                        reference_similarity=1.0 if ref_matched else 0.5,
                        description_similarity=1.0,
                        date_similarity=1.0
                    )
                    return ReconciliationResultSchema(
                        transaction_id=txn.transaction_id,
                        invoice_id=inv.invoice_id,
                        customer_name=inv.customer_name.original_value,
                        amount=txn_amount,
                        currency=txn_currency,
                        transaction_date=txn.date.original_value,
                        match_type="exact",
                        confidence=1.0,
                        confidence_level="HIGH",
                        payment_status="",  # To be calculated in Stage 4
                        days_late=0,
                        is_duplicate=False,
                        action="AUTO_RECONCILE",
                        reasons=reasons,
                        feature_breakdown=feature_breakdown
                    )

        return None
