import os
import pandas as pd
from typing import List, Dict, Any, Tuple, Optional
from backend.app.schemas.schemas import (
    InvoiceSchema,
    BankTransactionSchema,
    GroundTruthSchema,
    ReconciliationResultSchema,
    DashboardSummarySchema,
    EvaluationReportSchema
)
from backend.app.services.normalization.normalizer import Normalizer
from backend.app.services.candidate_generation.candidate_generator import CandidateGenerator
from backend.app.services.exact_matching.exact_matcher import ExactMatcher
from backend.app.services.fuzzy_matching.fuzzy_matcher import FuzzyMatcher
from backend.app.services.payment_status.payment_calculator import PaymentCalculator
from backend.app.services.duplicate_detection.duplicate_detector import DuplicateDetector
from backend.app.services.evaluation.evaluator import Evaluator

class ReconciliationPipeline:
    def __init__(self, data_dir: Optional[str] = None):
        self.data_dir = data_dir if (data_dir and os.path.exists(data_dir)) else None
        self.active_dir = self.data_dir
        self.source = "default" if self.data_dir else "none"
        
        self.invoices_path = os.path.join(self.active_dir, "invoices.csv") if self.active_dir else ""
        self.transactions_path = os.path.join(self.active_dir, "bank_transactions.csv") if self.active_dir else ""
        self.ground_truth_path = os.path.join(self.active_dir, "ground_truth.csv") if self.active_dir else ""
        
        # State stores
        self.human_overrides: Dict[str, Dict[str, Any]] = {}
        self.latest_results: List[ReconciliationResultSchema] = []
        self.invoices_list: List[InvoiceSchema] = []
        self.transactions_list: List[BankTransactionSchema] = []
        self.ground_truth_list: List[GroundTruthSchema] = []

    def set_dataset_source(self, source: str = "default", custom_dir: Optional[str] = None):
        if source == "uploaded" and custom_dir and os.path.exists(custom_dir):
            self.source = "uploaded"
            self.active_dir = custom_dir
        elif source == "default" and custom_dir and os.path.exists(custom_dir):
            self.data_dir = custom_dir
            self.source = "default"
            self.active_dir = custom_dir
        elif self.data_dir and os.path.exists(self.data_dir):
            self.source = "default"
            self.active_dir = self.data_dir
        else:
            self.source = "none"
            self.active_dir = None

        if self.active_dir:
            self.invoices_path = os.path.join(self.active_dir, "invoices.csv")
            self.transactions_path = os.path.join(self.active_dir, "bank_transactions.csv")
            self.ground_truth_path = os.path.join(self.active_dir, "ground_truth.csv")
        else:
            self.invoices_path = ""
            self.transactions_path = ""
            self.ground_truth_path = ""

        # Clear active pipeline state when switching datasets
        self.human_overrides = {}
        self.latest_results = []

    def load_data(self):
        # Load Invoices
        if self.invoices_path and os.path.exists(self.invoices_path):
            df_inv = pd.read_csv(self.invoices_path).fillna("")
            self.invoices_list = [InvoiceSchema(**row.to_dict()) for _, row in df_inv.iterrows()]
        else:
            self.invoices_list = []

        # Load Bank Transactions
        if self.transactions_path and os.path.exists(self.transactions_path):
            df_txn = pd.read_csv(self.transactions_path).fillna("")
            self.transactions_list = [BankTransactionSchema(**row.to_dict()) for _, row in df_txn.iterrows()]
        else:
            self.transactions_list = []

        # Load Ground Truth
        if self.ground_truth_path and os.path.exists(self.ground_truth_path):
            df_gt = pd.read_csv(self.ground_truth_path).fillna("")
            self.ground_truth_list = [
                GroundTruthSchema(
                    transaction_id=str(row["transaction_id"]),
                    invoice_id=str(row["invoice_id"]) if row["invoice_id"] else None,
                    match_type=str(row["match_type"]),
                    payment_status=str(row["payment_status"]),
                    is_duplicate=bool(row["is_duplicate"]) if isinstance(row["is_duplicate"], bool) else (str(row["is_duplicate"]).lower() == 'true')
                ) for _, row in df_gt.iterrows()
            ]
        else:
            self.ground_truth_list = []

    def run_pipeline(self) -> List[ReconciliationResultSchema]:
        self.load_data()

        if not self.invoices_list and not self.transactions_list:
            self.latest_results = []
            return []

        # Step 1: Data Normalization
        norm_invoices = [Normalizer.normalize_invoice(inv) for inv in self.invoices_list]
        norm_txns = [Normalizer.normalize_transaction(txn) for txn in self.transactions_list]

        inv_map = {inv.invoice_id: inv for inv in norm_invoices}

        raw_results: List[ReconciliationResultSchema] = []

        for norm_txn in norm_txns:
            # Check candidate generation
            candidates = CandidateGenerator.get_candidates(norm_txn, norm_invoices)

            # Stage 1: Exact Matching
            exact_res = ExactMatcher.match_transaction(norm_txn, candidates)
            
            if exact_res:
                raw_results.append(exact_res)
            else:
                # Stage 2: Fuzzy / AI Matching
                fuzzy_res = FuzzyMatcher.match_transaction(norm_txn, candidates)
                raw_results.append(fuzzy_res)

        # Stage 3: Duplicate Detection
        results_with_duplicates = DuplicateDetector.detect_duplicates(raw_results)

        # Stage 4: Payment Status Calculation & Override Injection
        final_results = []
        for res in results_with_duplicates:
            # Check human override
            if res.transaction_id in self.human_overrides:
                override = self.human_overrides[res.transaction_id]
                res.human_override = override
                action_type = override.get("status")
                target_inv_id = override.get("target_invoice_id")

                if action_type == "ACCEPT":
                    res.action = "AUTO_RECONCILE"
                    res.confidence_level = "HIGH"
                elif action_type == "REJECT" or action_type == "MARK_UNMATCHED":
                    res.invoice_id = None
                    res.match_type = "unmatched"
                    res.action = "UNMATCHED"
                    res.confidence_level = "LOW"
                elif action_type == "REASSIGN" and target_inv_id:
                    res.invoice_id = target_inv_id
                    res.match_type = "partial"
                    res.action = "AUTO_RECONCILE"

            # Compute payment status
            if res.invoice_id and res.invoice_id in inv_map:
                inv = inv_map[res.invoice_id]
                due_date_str = inv.due_date.normalized_value
                status, days_late = PaymentCalculator.calculate_matched_status(
                    res.transaction_date, due_date_str
                )
                res.payment_status = status
                res.days_late = days_late
            else:
                res.payment_status = "unpaid"
                res.days_late = 0

            final_results.append(res)

        self.latest_results = final_results
        return final_results

    def get_summary(self) -> DashboardSummarySchema:
        if not self.invoices_list and not self.transactions_list:
            self.load_data()

        if not self.invoices_list and not self.transactions_list:
            return DashboardSummarySchema(
                total_invoices=0,
                total_transactions=0,
                total_amount_invoiced=0.0,
                total_amount_received=0.0,
                matched_count=0,
                human_review_count=0,
                unmatched_count=0,
                duplicate_count=0,
                late_payments_count=0,
                overdue_invoices_count=0
            )

        if not self.latest_results:
            self.run_pipeline()

        total_invoices = len(self.invoices_list)
        total_txns = len(self.transactions_list)
        total_invoiced_amt = sum(inv.invoice_amount for inv in self.invoices_list)
        total_received_amt = sum(txn.amount for txn in self.transactions_list)

        matched_count = sum(1 for r in self.latest_results if r.match_type in ("exact", "partial"))
        human_review_count = sum(1 for r in self.latest_results if r.action == "HUMAN_REVIEW")
        unmatched_count = sum(1 for r in self.latest_results if r.match_type in ("unmatched", "mismatch"))
        duplicate_count = sum(1 for r in self.latest_results if r.is_duplicate)
        late_count = sum(1 for r in self.latest_results if r.payment_status == "late")

        # Overdue invoices check
        matched_invoice_ids = {r.invoice_id for r in self.latest_results if r.invoice_id and r.match_type != "unmatched"}
        overdue_invoices_count = 0
        norm_invoices = [Normalizer.normalize_invoice(inv) for inv in self.invoices_list]
        for inv in norm_invoices:
            if inv.invoice_id not in matched_invoice_ids:
                status, _ = PaymentCalculator.calculate_unpaid_status(inv.due_date.normalized_value)
                if status == "overdue":
                    overdue_invoices_count += 1

        return DashboardSummarySchema(
            total_invoices=total_invoices,
            total_transactions=total_txns,
            total_amount_invoiced=round(total_invoiced_amt, 2),
            total_amount_received=round(total_received_amt, 2),
            matched_count=matched_count,
            human_review_count=human_review_count,
            unmatched_count=unmatched_count,
            duplicate_count=duplicate_count,
            late_payments_count=late_count,
            overdue_invoices_count=overdue_invoices_count
        )

    def evaluate(self) -> Optional[EvaluationReportSchema]:
        if not self.latest_results and (self.invoices_list or self.transactions_list):
            self.run_pipeline()
        if not self.ground_truth_list:
            return None
        return Evaluator.evaluate(self.latest_results, self.ground_truth_list)
