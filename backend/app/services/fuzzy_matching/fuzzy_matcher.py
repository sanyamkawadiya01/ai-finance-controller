import math
from datetime import datetime
from typing import List, Optional, Tuple
from rapidfuzz import fuzz
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from backend.app.schemas.schemas import (
    NormalizedTransaction,
    NormalizedInvoice,
    ReconciliationResultSchema,
    FeatureBreakdown
)
from backend.app.config.config import settings

class FuzzyMatcher:
    @staticmethod
    def calculate_amount_similarity(amt1: float, amt2: float) -> float:
        if amt1 <= 0 or amt2 <= 0:
            return 0.0
        diff = abs(amt1 - amt2)
        max_amt = max(amt1, amt2)
        sim = 1.0 - (diff / max_amt)
        return max(0.0, min(1.0, sim))

    @staticmethod
    def calculate_string_similarity(str1: str, str2: str) -> float:
        if not str1 or not str2:
            return 0.0
        # RapidFuzz token_set_ratio is robust to word order and extra terms
        ratio = fuzz.token_set_ratio(str1, str2) / 100.0
        return ratio

    @staticmethod
    def calculate_tfidf_similarity(str1: str, str2: str) -> float:
        if not str1 or not str2:
            return 0.0
        try:
            vectorizer = TfidfVectorizer().fit([str1, str2])
            tfidf = vectorizer.transform([str1, str2])
            sim = cosine_similarity(tfidf[0:1], tfidf[1:2])[0][0]
            return float(sim)
        except Exception:
            return 0.0

    @staticmethod
    def calculate_date_similarity(date_str1: str, date_str2: str) -> float:
        if not date_str1 or not date_str2:
            return 0.5
        try:
            d1 = datetime.strptime(date_str1, "%Y-%m-%d")
            d2 = datetime.strptime(date_str2, "%Y-%m-%d")
            days_diff = abs((d1 - d2).days)
            # Exponential decay: 0 days diff = 1.0, 30 days diff ~ 0.5
            sim = math.exp(-days_diff / 30.0)
            return round(sim, 4)
        except Exception:
            return 0.5

    @classmethod
    def score_candidate(
        cls,
        txn: NormalizedTransaction,
        inv: NormalizedInvoice
    ) -> Tuple[float, FeatureBreakdown, List[str]]:
        # Amount similarity
        amt_sim = cls.calculate_amount_similarity(
            txn.amount.normalized_value,
            inv.amount.normalized_value
        )
        
        # Customer name similarity (combining token_set_ratio & tfidf)
        cust_fuzz = cls.calculate_string_similarity(
            txn.customer_name.normalized_value,
            inv.customer_name.normalized_value
        )
        cust_tfidf = cls.calculate_tfidf_similarity(
            txn.customer_name.normalized_value,
            inv.customer_name.normalized_value
        )
        cust_sim = max(cust_fuzz, cust_tfidf)

        # Reference similarity
        ref_sim = cls.calculate_string_similarity(
            txn.reference.normalized_value,
            inv.invoice_id
        )

        # Description similarity vs invoice metadata
        desc_sim = max(
            cls.calculate_string_similarity(txn.description.normalized_value, inv.customer_name.normalized_value),
            cls.calculate_string_similarity(txn.description.normalized_value, inv.invoice_id)
        )

        # Date proximity similarity
        date_sim = cls.calculate_date_similarity(
            txn.date.normalized_value,
            inv.due_date.normalized_value
        )

        # Weighted score
        total_score = (
            amt_sim * settings.WEIGHT_AMOUNT +
            cust_sim * settings.WEIGHT_CUSTOMER +
            ref_sim * settings.WEIGHT_REFERENCE +
            desc_sim * settings.WEIGHT_DESCRIPTION +
            date_sim * settings.WEIGHT_DATE
        )

        breakdown = FeatureBreakdown(
            amount_similarity=round(amt_sim, 4),
            customer_name_similarity=round(cust_sim, 4),
            reference_similarity=round(ref_sim, 4),
            description_similarity=round(desc_sim, 4),
            date_similarity=round(date_sim, 4)
        )

        reasons = []
        if cust_sim > 0.70:
            reasons.append(f"Customer name highly similar ({int(cust_sim*100)}% match)")
        elif cust_sim > 0.40:
            reasons.append(f"Customer name partially matched ({int(cust_sim*100)}% match)")
        else:
            reasons.append(f"Customer name mismatch ({int(cust_sim*100)}% match)")

        if amt_sim > 0.98:
            reasons.append("Amount closely matched")
        elif amt_sim > 0.90:
            reasons.append(f"Amount slightly different ({int(amt_sim*100)}% similarity)")
        else:
            reasons.append(f"Amount difference high ({int(amt_sim*100)}% similarity)")

        if ref_sim > 0.70:
            reasons.append(f"Invoice reference partially matched in transaction metadata")

        if date_sim > 0.70:
            reasons.append("Transaction date is close to invoice payment/due window")

        return round(total_score, 4), breakdown, reasons

    @classmethod
    def match_transaction(
        cls,
        txn: NormalizedTransaction,
        candidates: List[NormalizedInvoice]
    ) -> ReconciliationResultSchema:
        best_inv: Optional[NormalizedInvoice] = None
        best_score: float = 0.0
        best_breakdown: Optional[FeatureBreakdown] = None
        best_reasons: List[str] = []

        for inv in candidates:
            score, breakdown, reasons = cls.score_candidate(txn, inv)
            if score > best_score:
                best_score = score
                best_inv = inv
                best_breakdown = breakdown
                best_reasons = reasons

        # Stage 7 Confidence Decision
        if best_inv and best_score >= settings.MEDIUM_CONFIDENCE_THRESHOLD:
            if best_score >= settings.HIGH_CONFIDENCE_THRESHOLD:
                conf_level = "HIGH"
                action = "AUTO_RECONCILE"
                match_type = "partial"
            else:
                conf_level = "MEDIUM"
                action = "HUMAN_REVIEW"
                match_type = "partial"

            return ReconciliationResultSchema(
                transaction_id=txn.transaction_id,
                invoice_id=best_inv.invoice_id,
                customer_name=best_inv.customer_name.original_value,
                amount=txn.amount.normalized_value,
                currency=txn.currency.normalized_value,
                transaction_date=txn.date.original_value,
                match_type=match_type,
                confidence=best_score,
                confidence_level=conf_level,
                payment_status="",
                days_late=0,
                is_duplicate=False,
                action=action,
                reasons=best_reasons,
                feature_breakdown=best_breakdown
            )
        else:
            # Low confidence -> Unmatched or Mismatch
            # Check if reference pointed to a specific invoice despite low overall score (Mismatch case)
            mismatch_inv_id = None
            if txn.reference.normalized_value and txn.reference.normalized_value.startswith("INV-"):
                mismatch_inv_id = txn.reference.normalized_value

            return ReconciliationResultSchema(
                transaction_id=txn.transaction_id,
                invoice_id=mismatch_inv_id if mismatch_inv_id else (best_inv.invoice_id if best_inv and best_score > 0.3 else None),
                customer_name=txn.customer_name.original_value,
                amount=txn.amount.normalized_value,
                currency=txn.currency.normalized_value,
                transaction_date=txn.date.original_value,
                match_type="mismatch" if mismatch_inv_id else "unmatched",
                confidence=best_score,
                confidence_level="LOW",
                payment_status="unpaid",
                days_late=0,
                is_duplicate=False,
                action="HUMAN_REVIEW" if mismatch_inv_id else "UNMATCHED",
                reasons=["Insufficient overall match score across customer, reference, and amount features"] + best_reasons,
                feature_breakdown=best_breakdown
            )
