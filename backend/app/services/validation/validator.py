import re
from datetime import datetime
from typing import Dict, Any, List, Tuple, Optional
import pandas as pd

class DatasetValidator:
    REQUIRED_INVOICE_COLS = [
        "invoice_id", "customer_id", "customer_name", 
        "invoice_date", "due_date", "invoice_amount", "currency"
    ]
    
    REQUIRED_TRANSACTION_COLS = [
        "transaction_id", "transaction_date", "description", 
        "customer_name", "reference", "amount", "currency"
    ]
    
    REQUIRED_GROUND_TRUTH_COLS = [
        "transaction_id", "invoice_id", "match_type", 
        "payment_status", "is_duplicate"
    ]
    
    VALID_MATCH_TYPES = {"exact", "partial", "mismatch", "unmatched", "duplicate"}
    VALID_PAYMENT_STATUSES = {"on_time", "late", "overdue", "unpaid", ""}

    @classmethod
    def validate_invoices_df(cls, df: pd.DataFrame) -> Tuple[List[str], List[str]]:
        errors = []
        warnings = []

        if df.empty:
            errors.append("Invoices CSV is empty")
            return errors, warnings

        # 1. Missing columns
        missing_cols = [col for col in cls.REQUIRED_INVOICE_COLS if col not in df.columns]
        if missing_cols:
            errors.append(f"Invoices CSV missing required column(s): {', '.join(missing_cols)}")
            return errors, warnings

        # 2. Duplicate IDs
        dup_ids = df[df["invoice_id"].duplicated()]["invoice_id"].tolist()
        if dup_ids:
            errors.append(f"Duplicate invoice_id(s) found in invoices: {', '.join(map(str, dup_ids[:5]))}")

        # 3. Row-level checks
        for idx, row in df.iterrows():
            row_num = idx + 2  # 1-indexed row number including header
            
            # Missing required values
            if pd.isna(row["invoice_id"]) or str(row["invoice_id"]).strip() == "":
                errors.append(f"Row {row_num}: invoice_id is missing")
            if pd.isna(row["customer_name"]) or str(row["customer_name"]).strip() == "":
                errors.append(f"Row {row_num}: customer_name is missing")
                
            # Numeric amount check
            amt_raw = str(row["invoice_amount"]).replace("$", "").replace(",", "").strip()
            try:
                amt_val = float(amt_raw)
                if amt_val <= 0:
                    warnings.append(f"Row {row_num}: invoice_amount is non-positive ({amt_val})")
            except (ValueError, TypeError):
                errors.append(f"Row {row_num}: Invalid numeric invoice_amount '{row['invoice_amount']}'")

            # Date format check
            for date_col in ["invoice_date", "due_date"]:
                date_str = str(row[date_col]).strip() if not pd.isna(row[date_col]) else ""
                if not date_str:
                    errors.append(f"Row {row_num}: {date_col} is missing")
                else:
                    if not cls._is_valid_date(date_str):
                        errors.append(f"Row {row_num}: Invalid {date_col} format '{date_str}'")

        return errors, warnings

    @classmethod
    def validate_transactions_df(cls, df: pd.DataFrame) -> Tuple[List[str], List[str]]:
        errors = []
        warnings = []

        if df.empty:
            errors.append("Bank Transactions CSV is empty")
            return errors, warnings

        # 1. Missing columns
        missing_cols = [col for col in cls.REQUIRED_TRANSACTION_COLS if col not in df.columns]
        if missing_cols:
            errors.append(f"Bank Transactions CSV missing required column(s): {', '.join(missing_cols)}")
            return errors, warnings

        # 2. Duplicate IDs
        dup_ids = df[df["transaction_id"].duplicated()]["transaction_id"].tolist()
        if dup_ids:
            errors.append(f"Duplicate transaction_id(s) found in transactions: {', '.join(map(str, dup_ids[:5]))}")

        # 3. Row-level checks
        for idx, row in df.iterrows():
            row_num = idx + 2
            
            if pd.isna(row["transaction_id"]) or str(row["transaction_id"]).strip() == "":
                errors.append(f"Row {row_num}: transaction_id is missing")
            if pd.isna(row["description"]) or str(row["description"]).strip() == "":
                warnings.append(f"Row {row_num}: description is empty")
                
            # Numeric amount check
            amt_raw = str(row["amount"]).replace("$", "").replace(",", "").strip()
            try:
                amt_val = float(amt_raw)
                if amt_val <= 0:
                    warnings.append(f"Row {row_num}: transaction amount is non-positive ({amt_val})")
            except (ValueError, TypeError):
                errors.append(f"Row {row_num}: Invalid numeric transaction amount '{row['amount']}'")

            # Date format check
            date_str = str(row["transaction_date"]).strip() if not pd.isna(row["transaction_date"]) else ""
            if not date_str:
                errors.append(f"Row {row_num}: transaction_date is missing")
            elif not cls._is_valid_date(date_str):
                errors.append(f"Row {row_num}: Invalid transaction_date format '{date_str}'")

        return errors, warnings

    @classmethod
    def validate_ground_truth_df(
        cls, 
        df: pd.DataFrame, 
        valid_txn_ids: set, 
        valid_inv_ids: set
    ) -> Tuple[List[str], List[str]]:
        errors = []
        warnings = []

        if df.empty:
            warnings.append("Ground Truth CSV is empty")
            return errors, warnings

        # 1. Missing columns
        missing_cols = [col for col in cls.REQUIRED_GROUND_TRUTH_COLS if col not in df.columns]
        if missing_cols:
            errors.append(f"Ground Truth CSV missing required column(s): {', '.join(missing_cols)}")
            return errors, warnings

        # 2. Duplicate IDs
        dup_ids = df[df["transaction_id"].duplicated()]["transaction_id"].tolist()
        if dup_ids:
            errors.append(f"Duplicate transaction_id(s) found in ground truth: {', '.join(map(str, dup_ids[:5]))}")

        # 3. Row-level checks
        for idx, row in df.iterrows():
            row_num = idx + 2
            
            txn_id = str(row["transaction_id"]).strip() if not pd.isna(row["transaction_id"]) else ""
            inv_id = str(row["invoice_id"]).strip() if not pd.isna(row["invoice_id"]) else ""
            match_type = str(row["match_type"]).strip().lower() if not pd.isna(row["match_type"]) else ""
            pay_status = str(row["payment_status"]).strip().lower() if not pd.isna(row["payment_status"]) else ""

            if not txn_id:
                errors.append(f"Ground Truth Row {row_num}: transaction_id is missing")
            elif valid_txn_ids and txn_id not in valid_txn_ids:
                errors.append(f"Ground Truth Row {row_num}: transaction_id '{txn_id}' does not exist in Bank Transactions dataset")

            if inv_id and valid_inv_ids and inv_id not in valid_inv_ids:
                errors.append(f"Ground Truth Row {row_num}: invoice_id '{inv_id}' does not exist in Invoices dataset")

            if match_type not in cls.VALID_MATCH_TYPES:
                errors.append(f"Ground Truth Row {row_num}: Invalid match_type '{row['match_type']}'. Expected one of {cls.VALID_MATCH_TYPES}")

            if pay_status not in cls.VALID_PAYMENT_STATUSES:
                warnings.append(f"Ground Truth Row {row_num}: Unusual payment_status '{row['payment_status']}'")

        return errors, warnings

    @staticmethod
    def _is_valid_date(date_str: str) -> bool:
        if not date_str:
            return False
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%Y/%m/%d"):
            try:
                datetime.strptime(date_str, fmt)
                return True
            except ValueError:
                continue
        return False
