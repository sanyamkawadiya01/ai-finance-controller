export interface Invoice {
  invoice_id: string;
  customer_id: string;
  customer_name: string;
  invoice_date: string;
  due_date: string;
  invoice_amount: number;
  currency: string;
}

export interface BankTransaction {
  transaction_id: string;
  transaction_date: string;
  description: string;
  customer_name: string;
  reference: string;
  amount: number;
  currency: string;
}

export interface FeatureBreakdown {
  amount_similarity: number;
  customer_name_similarity: number;
  reference_similarity: number;
  description_similarity: number;
  date_similarity: number;
}

export interface ReconciliationResult {
  transaction_id: string;
  invoice_id: string | null;
  customer_name: string;
  amount: number;
  currency: string;
  transaction_date: string;
  match_type: 'exact' | 'partial' | 'mismatch' | 'unmatched' | 'duplicate';
  confidence: number;
  confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
  payment_status: 'on_time' | 'late' | 'overdue' | 'unpaid' | '';
  days_late: number;
  is_duplicate: boolean;
  action: 'AUTO_RECONCILE' | 'HUMAN_REVIEW' | 'UNMATCHED';
  reasons: string[];
  feature_breakdown?: FeatureBreakdown;
  human_override?: {
    status: string;
    target_invoice_id?: string;
    reviewer_notes?: string;
  };
}

export interface DashboardSummary {
  total_invoices: number;
  total_transactions: number;
  total_amount_invoiced: number;
  total_amount_received: number;
  matched_count: number;
  human_review_count: number;
  unmatched_count: number;
  duplicate_count: number;
  late_payments_count: number;
  overdue_invoices_count: number;
}

export interface MetricDetail {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
}

export interface ComparisonItem {
  transaction_id: string;
  predicted_invoice_id: string | null;
  ground_truth_invoice_id: string | null;
  predicted_match_type: string;
  ground_truth_match_type: string;
  predicted_payment_status: string;
  ground_truth_payment_status: string;
  is_duplicate_predicted: boolean;
  is_duplicate_ground_truth: boolean;
  is_match_correct: boolean;
  is_status_correct: boolean;
  confidence: number;
  action: string;
}

export interface EvaluationReport {
  overall_accuracy: number;
  overall_precision: number;
  overall_recall: number;
  overall_f1: number;
  category_metrics: Record<string, MetricDetail>;
  confusion_matrix: Record<string, Record<string, number>>;
  predictions_vs_ground_truth: ComparisonItem[];
}

export interface DatasetUploadResponse {
  success: boolean;
  source: string;
  invoices_count: number;
  transactions_count: number;
  ground_truth_count: number;
  ground_truth_available: boolean;
  errors: string[];
  warnings: string[];
}

export interface DatasetStatus {
  active: boolean;
  source: 'default' | 'uploaded';
  invoices_count: number;
  transactions_count: number;
  ground_truth_available: boolean;
}

