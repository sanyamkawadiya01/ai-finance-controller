# AI Finance Controller - Payment Reconciliation Synthetic Test Dataset

This directory contains a synthetic dataset of **100 invoices** and corresponding bank transactions designed specifically for testing and evaluating payment reconciliation AI models and rule engines.

---

## Dataset File Overview

The dataset consists of exactly three CSV files:

| File Name | Record Count | Description |
|---|---|---|
| [`invoices.csv`](file:///c:/Users/sanya/New%20folder%20%282%29/dataset/invoices.csv) | 100 | Accounts receivable invoice records issued to customers. |
| [`bank_statement.csv`](file:///c:/Users/sanya/New%20folder%20%282%29/dataset/bank_statement.csv) | 85 | Electronic bank statement transaction records. |
| [`ground_truth.csv`](file:///c:/Users/sanya/New%20folder%20%282%29/dataset/ground_truth.csv) | 110 | Expected reconciliation mapping and target metrics. |

---

## 1. `invoices.csv`

Contains 100 realistic invoice records issued to Indian enterprise customers in Indian Rupees (INR).

### Schema & Fields

- **`invoice_id`**: Unique identifier for the invoice (e.g., `INV-2026-001`).
- **`customer_id`**: Unique identifier for the customer (e.g., `CUST-001`).
- **`customer_name`**: Name of the customer/company (e.g., `Tata Consultancy Services Ltd`).
- **`invoice_date`**: Date the invoice was generated (`YYYY-MM-DD`).
- **`due_date`**: Payment due date (`YYYY-MM-DD`).
- **`invoice_amount`**: Billed amount in INR (e.g., `125000.00`).
- **`currency`**: Currency code (`INR`).
- **`description`**: Service or item description (e.g., `IT Infrastructure & Cloud Hosting Services`).

---

## 2. `bank_statement.csv`

Contains 85 incoming payment transactions logged in the company bank statement.

### Schema & Fields

- **`transaction_id`**: Unique transaction identifier (e.g., `TXN-2026-001`).
- **`transaction_date`**: Date payment hit the bank account (`YYYY-MM-DD`).
- **`transaction_type`**: Payment method (`NEFT`, `RTGS`, `UPI`, `IMPS`, `ACH CREDIT`).
- **`amount`**: Received payment amount in INR (e.g., `125000.00`).
- **`currency`**: Currency code (`INR`).
- **`customer_name`**: Sender or payer name reported on the bank statement.
- **`reference`**: Bank payment reference string (e.g., `NEFT/INV-2026-001/REF12345`).
- **`description`**: Bank transaction narrative.

---

## 3. `ground_truth.csv`

Contains the target answers to benchmark the performance of automated payment reconciliation systems.

### Schema & Fields

- **`transaction_id`**: Associated bank transaction ID (blank if `No Payment`).
- **`invoice_id`**: Associated invoice ID (blank if `Unmatched`).
- **`match_type`**: Classification of the relationship (see definitions below).
- **`is_match`**: Binary flag (`1` for valid invoice match, `0` otherwise).
- **`amount_difference`**: Calculated as `bank_transaction_amount - invoice_amount` (blank if no bank txn or no invoice).
- **`payment_timing`**: Payment timing relative to due date (`Early`, `On Time`, `Late`, `Not Paid`, or blank for unmatched bank txns).
- **`is_duplicate`**: Binary flag (`1` for duplicate payment txns, `0` otherwise).
- **`is_unmatched`**: Binary flag (`1` for bank transactions with no invoice, `0` otherwise).

---

## How the Three Files Are Related

1. Each record in `ground_truth.csv` links a bank transaction in `bank_statement.csv` to its corresponding invoice in `invoices.csv`.
2. **One-to-One Matches**: Standard invoices with single payments link 1 `invoice_id` to 1 `transaction_id`.
3. **One-to-Many Matches (Duplicates)**: Paid invoices that received an accidental second payment link multiple bank `transaction_id`s to the same `invoice_id`.
4. **Unmatched Transactions**: Bank transactions without any corresponding invoice have `invoice_id` left empty and `is_unmatched = 1`.
5. **Unpaid Invoices**: Invoices with no incoming payments have `transaction_id` left empty and `match_type = No Payment`.

---

## Match Types & Scenario Definitions

| Match Type | Description | `is_match` | `is_duplicate` | `is_unmatched` | Count |
|---|---|:---:|:---:|:---:|:---:|
| **Exact Match** | Bank transaction belongs to invoice and payment amount equals invoice amount exactly. | `1` | `0` | `0` | 50 |
| **Partial Match** | Bank transaction belongs to invoice but customer paid less than the full invoice amount. | `1` | `0` | `0` | 15 |
| **Amount Mismatch** | Bank transaction belongs to invoice but the payment amount differs (overpaid or variance flagged). | `1` | `0` | `0` | 10 |
| **Duplicate Payment** | An extra payment made for an invoice that was already previously paid. | `1` | `0` | `0` | 5 |
| **Unmatched** | Bank credit transaction received with no corresponding invoice found in records. | `0` | `0` | `1` | 5 |
| **No Payment** | Billed invoice has received no payment transaction in bank records. | `0` | `0` | `0` | 25 |
