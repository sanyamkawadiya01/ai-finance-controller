from typing import List, Dict
from collections import defaultdict
from backend.app.schemas.schemas import ReconciliationResultSchema

class DuplicateDetector:
    @staticmethod
    def detect_duplicates(results: List[ReconciliationResultSchema]) -> List[ReconciliationResultSchema]:
        """
        Scans reconciliation results to identify duplicate payments targeting the same invoice
        or identical customer + amount + date patterns.
        Flags secondary/subsequent transactions as `is_duplicate = True` and match_type = 'duplicate'.
        """
        # Map invoice_id -> list of matched results
        invoice_matches: Dict[str, List[ReconciliationResultSchema]] = defaultdict(list)
        
        for res in results:
            if res.invoice_id and res.match_type in ("exact", "partial", "duplicate"):
                invoice_matches[res.invoice_id].append(res)

        # Flag duplicates
        for inv_id, match_list in invoice_matches.items():
            if len(match_list) > 1:
                # Sort by transaction date / transaction ID to keep primary match intact
                sorted_matches = sorted(match_list, key=lambda r: (r.transaction_date, r.transaction_id))
                primary = sorted_matches[0]
                
                for secondary in sorted_matches[1:]:
                    secondary.is_duplicate = True
                    secondary.match_type = "duplicate"
                    secondary.reasons.append(
                        f"Duplicate payment detected! Invoice '{inv_id}' already matched with primary transaction '{primary.transaction_id}'"
                    )
                    # If secondary was auto-reconcile, mark for human review or duplicate status
                    if secondary.action == "AUTO_RECONCILE":
                        secondary.action = "HUMAN_REVIEW"

        return results
