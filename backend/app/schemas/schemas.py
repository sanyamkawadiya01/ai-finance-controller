from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class InvoiceSchema(BaseModel):
    invoice_id: str
    customer_id: str
    customer_name: str
    invoice_date: str
    due_date: str
    invoice_amount: float
    currency: str

class BankTransactionSchema(BaseModel):
    transaction_id: str
    transaction_date: str
    description: str
    customer_name: str
    reference: Optional[str] = ""
    amount: float
    currency: str

class GroundTruthSchema(BaseModel):
    transaction_id: str
    invoice_id: Optional[str] = None
    match_type: str
    payment_status: str
    is_duplicate: bool

class NormalizedEntity(BaseModel):
    original_value: Any
    normalized_value: Any

class NormalizedTransaction(BaseModel):
    transaction_id: str
    customer_name: NormalizedEntity
    reference: NormalizedEntity
    description: NormalizedEntity
    currency: NormalizedEntity
    date: NormalizedEntity
    amount: NormalizedEntity

class NormalizedInvoice(BaseModel):
    invoice_id: str
    customer_id: str
    customer_name: NormalizedEntity
    currency: NormalizedEntity
    invoice_date: NormalizedEntity
    due_date: NormalizedEntity
    amount: NormalizedEntity

class FeatureBreakdown(BaseModel):
    amount_similarity: float
    customer_name_similarity: float
    reference_similarity: float
    description_similarity: float
    date_similarity: float

class ReconciliationResultSchema(BaseModel):
    transaction_id: str
    invoice_id: Optional[str] = None
    customer_name: str
    amount: float
    currency: str
    transaction_date: str
    match_type: str  # exact, partial, mismatch, unmatched, duplicate
    confidence: float
    confidence_level: str  # HIGH, MEDIUM, LOW
    payment_status: str  # on_time, late, overdue, unpaid
    days_late: int = 0
    is_duplicate: bool = False
    action: str  # AUTO_RECONCILE, HUMAN_REVIEW, UNMATCHED
    reasons: List[str] = []
    feature_breakdown: Optional[FeatureBreakdown] = None
    human_override: Optional[Dict[str, Any]] = None

class DashboardSummarySchema(BaseModel):
    total_invoices: int
    total_transactions: int
    total_amount_invoiced: float
    total_amount_received: float
    matched_count: int
    human_review_count: int
    unmatched_count: int
    duplicate_count: int
    late_payments_count: int
    overdue_invoices_count: int

class MetricDetail(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1_score: float

class EvaluationReportSchema(BaseModel):
    overall_accuracy: float
    overall_precision: float
    overall_recall: float
    overall_f1: float
    category_metrics: Dict[str, MetricDetail]
    confusion_matrix: Dict[str, Dict[str, int]]
    predictions_vs_ground_truth: List[Dict[str, Any]]

class HumanReviewRequestSchema(BaseModel):
    status: str  # ACCEPT, REJECT, REASSIGN, MARK_UNMATCHED
    target_invoice_id: Optional[str] = None
    reviewer_notes: Optional[str] = ""

class DatasetUploadResponseSchema(BaseModel):
    success: bool
    source: str = "uploaded"
    invoices_count: int
    transactions_count: int
    ground_truth_count: int = 0
    ground_truth_available: bool = False
    errors: List[str] = []
    warnings: List[str] = []

class DatasetStatusSchema(BaseModel):
    active: bool = True
    source: str  # "default" or "uploaded"
    invoices_count: int
    transactions_count: int
    ground_truth_available: bool

