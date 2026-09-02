from typing import List, Dict, Any
from collections import defaultdict
from sklearn.metrics import precision_recall_fscore_support, accuracy_score
from backend.app.schemas.schemas import ReconciliationResultSchema, GroundTruthSchema, EvaluationReportSchema, MetricDetail

class Evaluator:
    @staticmethod
    def evaluate(
        predictions: List[ReconciliationResultSchema],
        ground_truth_list: List[GroundTruthSchema]
    ) -> EvaluationReportSchema:
        gt_map: Dict[str, GroundTruthSchema] = {gt.transaction_id: gt for gt in ground_truth_list}
        
        y_true_match = []
        y_pred_match = []
        
        comparison_list = []

        match_types = ["exact", "partial", "mismatch", "unmatched", "duplicate"]
        conf_matrix: Dict[str, Dict[str, int]] = {gt: {pred: 0 for pred in match_types} for gt in match_types}

        for pred in predictions:
            gt = gt_map.get(pred.transaction_id)
            if not gt:
                continue

            gt_match = gt.match_type.lower()
            pred_match = pred.match_type.lower()

            y_true_match.append(gt_match)
            y_pred_match.append(pred_match)

            if gt_match in conf_matrix and pred_match in conf_matrix[gt_match]:
                conf_matrix[gt_match][pred_match] += 1
            else:
                conf_matrix.setdefault(gt_match, {})[pred_match] = conf_matrix.get(gt_match, {}).get(pred_match, 0) + 1

            is_match_correct = (gt_match == pred_match and (pred.invoice_id or "") == (gt.invoice_id or ""))
            is_status_correct = (pred.payment_status.lower() == gt.payment_status.lower())

            comparison_list.append({
                "transaction_id": pred.transaction_id,
                "predicted_invoice_id": pred.invoice_id,
                "ground_truth_invoice_id": gt.invoice_id,
                "predicted_match_type": pred_match,
                "ground_truth_match_type": gt_match,
                "predicted_payment_status": pred.payment_status,
                "ground_truth_payment_status": gt.payment_status,
                "is_duplicate_predicted": pred.is_duplicate,
                "is_duplicate_ground_truth": gt.is_duplicate,
                "is_match_correct": is_match_correct,
                "is_status_correct": is_status_correct,
                "confidence": pred.confidence,
                "action": pred.action
            })

        # Calculate overall accuracy
        overall_acc = accuracy_score(y_true_match, y_pred_match) if y_true_match else 0.0

        # Calculate overall macro precision, recall, f1
        p_macro, r_macro, f1_macro, _ = precision_recall_fscore_support(
            y_true_match, y_pred_match, average='macro', zero_division=0
        )

        # Calculate per-category metrics
        category_metrics: Dict[str, MetricDetail] = {}
        for cat in match_types:
            # Binary one-vs-rest metrics for category
            y_t_cat = [1 if t == cat else 0 for t in y_true_match]
            y_p_cat = [1 if p == cat else 0 for p in y_pred_match]
            acc_cat = accuracy_score(y_t_cat, y_p_cat) if y_t_cat else 0.0
            p_cat, r_cat, f1_cat, _ = precision_recall_fscore_support(
                y_t_cat, y_p_cat, average='binary', zero_division=0
            )
            category_metrics[cat] = MetricDetail(
                accuracy=round(float(acc_cat), 4),
                precision=round(float(p_cat), 4),
                recall=round(float(r_cat), 4),
                f1_score=round(float(f1_cat), 4)
            )

        return EvaluationReportSchema(
            overall_accuracy=round(float(overall_acc), 4),
            overall_precision=round(float(p_macro), 4),
            overall_recall=round(float(r_macro), 4),
            overall_f1=round(float(f1_macro), 4),
            category_metrics=category_metrics,
            confusion_matrix=conf_matrix,
            predictions_vs_ground_truth=comparison_list
        )
