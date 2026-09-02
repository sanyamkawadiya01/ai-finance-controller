import re
from datetime import datetime
from typing import Dict, Any, Optional
from backend.app.schemas.schemas import NormalizedEntity, NormalizedTransaction, NormalizedInvoice, BankTransactionSchema, InvoiceSchema

COMPANY_SUFFIX_PATTERN = re.compile(
    r'\b(pvt\.?\s*ltd\.?|private\s+limited|llc\.?|inc\.?|incorporated|corp\.?|corporation|group|solutions|systems|enterprises|holdings|pharma|bio-?tech|cloud\s+services|media\s+network|financials)\b',
    re.IGNORECASE
)

NOISE_WORDS_PATTERN = re.compile(
    r'\b(wire\s+transfer|ach\s+payment|ach\s+direct\s+debit|inward\s+remittance|sepa\s+transfer|sepa\s+clearing|check\s+deposit|check\s+clearing|direct\s+debit|duplicate\s+wire|refund\b|from|to|for|via|payment|pymt|ref|neft)\b',
    re.IGNORECASE
)

INVOICE_REF_REGEX = re.compile(r'INV[-/\s]?\d{4}[-/\s]?\d{3}', re.IGNORECASE)

class Normalizer:
    @staticmethod
    def normalize_text(text: Optional[str]) -> str:
        if not text:
            return ""
        # Lowercase
        cleaned = text.lower().strip()
        # Replace punctuation except hyphens
        cleaned = re.sub(r'[^\w\s-]', '', cleaned)
        # Standardize whitespace
        cleaned = re.sub(r'\s+', ' ', cleaned)
        return cleaned

    @staticmethod
    def normalize_customer_name(name: Optional[str]) -> str:
        if not name:
            return ""
        cleaned = Normalizer.normalize_text(name)
        # Strip common legal entity suffixes to produce core business name
        core_name = COMPANY_SUFFIX_PATTERN.sub('', cleaned)
        core_name = re.sub(r'\s+', ' ', core_name).strip()
        return core_name if core_name else cleaned

    @staticmethod
    def extract_invoice_reference(text: Optional[str]) -> str:
        if not text:
            return ""
        match = INVOICE_REF_REGEX.search(text)
        if match:
            raw_ref = match.group(0).upper()
            # Standardize to INV-YYYY-XXX format
            digits = re.findall(r'\d+', raw_ref)
            if len(digits) >= 2:
                return f"INV-{digits[0]}-{digits[1]}"
            elif len(digits) == 1 and len(digits[0]) >= 7:
                # e.g., INV2026005 -> INV-2026-005
                year = digits[0][:4]
                num = digits[0][4:]
                return f"INV-{year}-{num}"
            return raw_ref
        return ""

    @staticmethod
    def normalize_reference(ref: Optional[str], description: Optional[str] = "") -> str:
        extracted = Normalizer.extract_invoice_reference(ref)
        if extracted:
            return extracted
        # Try extracting from description if reference field is blank or dirty
        extracted_from_desc = Normalizer.extract_invoice_reference(description)
        if extracted_from_desc:
            return extracted_from_desc
        return Normalizer.normalize_text(ref)

    @staticmethod
    def normalize_description(desc: Optional[str]) -> str:
        if not desc:
            return ""
        cleaned = Normalizer.normalize_text(desc)
        cleaned_no_noise = NOISE_WORDS_PATTERN.sub('', cleaned)
        cleaned_no_noise = re.sub(r'\s+', ' ', cleaned_no_noise).strip()
        return cleaned_no_noise

    @staticmethod
    def normalize_currency(currency: Optional[str]) -> str:
        if not currency:
            return "USD"
        curr = currency.upper().strip()
        symbols = {"$": "USD", "€": "EUR", "£": "GBP", "₹": "INR"}
        return symbols.get(curr, curr)

    @staticmethod
    def normalize_amount(amount: Any) -> float:
        if isinstance(amount, (int, float)):
            return round(float(amount), 2)
        if isinstance(amount, str):
            clean_str = re.sub(r'[^\d.-]', '', amount)
            try:
                return round(float(clean_str), 2)
            except ValueError:
                return 0.0
        return 0.0

    @staticmethod
    def normalize_date(date_str: str) -> str:
        if not date_str:
            return ""
        date_str = date_str.strip()
        for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%Y/%m/%d"):
            try:
                dt = datetime.strptime(date_str, fmt)
                return dt.strftime("%Y-%m-%d")
            except ValueError:
                continue
        return date_str

    @classmethod
    def normalize_transaction(cls, txn: BankTransactionSchema) -> NormalizedTransaction:
        norm_ref = cls.normalize_reference(txn.reference, txn.description)
        return NormalizedTransaction(
            transaction_id=txn.transaction_id,
            customer_name=NormalizedEntity(original_value=txn.customer_name, normalized_value=cls.normalize_customer_name(txn.customer_name)),
            reference=NormalizedEntity(original_value=txn.reference, normalized_value=norm_ref),
            description=NormalizedEntity(original_value=txn.description, normalized_value=cls.normalize_description(txn.description)),
            currency=NormalizedEntity(original_value=txn.currency, normalized_value=cls.normalize_currency(txn.currency)),
            date=NormalizedEntity(original_value=txn.transaction_date, normalized_value=cls.normalize_date(txn.transaction_date)),
            amount=NormalizedEntity(original_value=txn.amount, normalized_value=cls.normalize_amount(txn.amount)),
        )

    @classmethod
    def normalize_invoice(cls, inv: InvoiceSchema) -> NormalizedInvoice:
        norm_ref = cls.normalize_reference(inv.invoice_id)
        return NormalizedInvoice(
            invoice_id=inv.invoice_id,
            customer_id=inv.customer_id,
            customer_name=NormalizedEntity(original_value=inv.customer_name, normalized_value=cls.normalize_customer_name(inv.customer_name)),
            currency=NormalizedEntity(original_value=inv.currency, normalized_value=cls.normalize_currency(inv.currency)),
            invoice_date=NormalizedEntity(original_value=inv.invoice_date, normalized_value=cls.normalize_date(inv.invoice_date)),
            due_date=NormalizedEntity(original_value=inv.due_date, normalized_value=cls.normalize_date(inv.due_date)),
            amount=NormalizedEntity(original_value=inv.invoice_amount, normalized_value=cls.normalize_amount(inv.invoice_amount)),
        )
