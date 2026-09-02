# AI Finance Controller — Payment Reconciliation Prototype

A clean, modular, deterministic, and AI-assisted **Payment Reconciliation Engine** for accounts receivable reconciliation.

---

## 🌟 Overview & Architecture

The system reconciles customer invoices against incoming bank transactions using a **hybrid multi-stage approach**:

```
Upload/Load Invoices
        +
Upload/Load Bank Transactions
        ↓
Data Normalization (Dual Representation)
        ↓
Candidate Generation (Currency / Date / Amount Blocking)
        ↓
Stage 1: Deterministic Exact Matching Engine (Rule-based, 100% Explainable)
        ↓ (if exact match fails)
Stage 2: AI / Fuzzy Feature-Based Matching (Weighted Similarity Scoring)
        ↓
Confidence Decision (HIGH -> Auto Match, MEDIUM -> Human Review, LOW -> Unmatched)
        ↓
Payment Status Calculation (On-Time, Late, Overdue, Unpaid)
        ↓
Duplicate Payment Detection (Cross-transaction audit)
        ↓
Dashboard & Ground Truth Evaluation (Accuracy, Precision, Recall, F1 & Confusion Matrix)
        ↓
Human Review Module (Accept, Reject, Reassign, Mark Unmatched)
```

---

## 🚀 Key Features

1. **Deterministic First, AI-Assisted Second**: LLMs or fuzzy scoring are not wasted on simple exact matches. Deterministic rule-matching handles standard payments fast and with 100% explainability.
2. **Dual-Value Preprocessing**: All text, dates, amounts, currencies, and references maintain both `original_value` and `normalized_value`.
3. **Feature-Based Scoring Model**: Calculates amount similarity, customer string token set ratio + TF-IDF cosine similarity, invoice reference extraction, bank description keyword matching, and exponential date decay.
4. **Rule-Based Payment Status & Duplicates**: Calculates `on_time`, `late` (with `days_late`), `overdue`, and `unpaid` statuses. Detects multi-payment duplicate attempts for the same invoice.
5. **Ground Truth Evaluation Engine**: Computes Accuracy, Precision, Recall, F1 Score (overall and category-wise), and renders a dynamic confusion matrix.
6. **Human Review System**: Interactively override medium/low confidence predictions from the UI with full backend persistence.

---

## 📁 Repository Structure

```text
finance-controller/
│
├── data/
│   ├── invoices.csv              # 20 Realistic Customer Invoices
│   ├── bank_transactions.csv     # 20 Realistic Bank Transactions
│   └── ground_truth.csv          # Ground Truth Labels & Statuses
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── main.py           # FastAPI Application & Routes
│   │   ├── config/
│   │   │   └── config.py         # Configurable Thresholds & Weights
│   │   ├── schemas/
│   │   │   └── schemas.py        # Pydantic Schemas
│   │   ├── services/
│   │   │   ├── normalization/    # Normalizer Engine
│   │   │   ├── candidate_generation/ # Candidate Filtering
│   │   │   ├── exact_matching/   # Stage 1 Exact Matcher
│   │   │   ├── fuzzy_matching/   # Stage 2 Scored Feature Matcher
│   │   │   ├── payment_status/   # Payment Status Engine
│   │   │   ├── duplicate_detection/ # Duplicate Payment Detector
│   │   │   ├── evaluation/       # Ground Truth Evaluator
│   │   │   └── pipeline.py       # Pipeline Orchestrator
│   └── tests/                    # Pytest Suite (14 unit tests)
│
├── frontend/                     # React + TypeScript + Vite Dashboard
│   ├── src/
│   │   ├── components/           # Dashboard Summary, Table, Modal, Evaluation
│   │   ├── App.tsx               # Main Dashboard App
│   │   └── index.css             # Glassmorphic Modern Dark Theme
│   └── package.json
│
├── README.md
└── requirements.txt
```

---

## 🛠️ Setup & Local Execution

### 1. Prerequisites
- Python 3.9+
- Node.js v18+ & npm

### 2. Backend Setup & Run

Install Python dependencies:
```bash
python -m pip install pandas numpy rapidfuzz scikit-learn fastapi uvicorn pydantic pytest
```

Run Backend Unit Tests:
```bash
python -m pytest backend/tests/ -v
```

Start FastAPI Backend Server:
```bash
python -m uvicorn backend.app.api.main:app --reload --port 8000
```
FastAPI Interactive Documentation will be available at: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Frontend Setup & Run

Navigate to frontend folder:
```bash
cd frontend
npm install
npm run dev
```
Open your browser at: [http://localhost:5173](http://localhost:5173)

---

## ⚙️ Configurable Parameters

In `backend/app/config/config.py`:
- `HIGH_CONFIDENCE_THRESHOLD`: `0.85` (Auto reconcile threshold)
- `MEDIUM_CONFIDENCE_THRESHOLD`: `0.60` (Human review threshold)
- Feature Weights:
  - `WEIGHT_AMOUNT`: `0.35`
  - `WEIGHT_CUSTOMER`: `0.30`
  - `WEIGHT_REFERENCE`: `0.20`
  - `WEIGHT_DESCRIPTION`: `0.10`
  - `WEIGHT_DATE`: `0.05`

---

## 📊 Sample Pipeline Output

For an exact match (`TXN-101` vs `INV-2026-001`):
```json
{
  "transaction_id": "TXN-101",
  "invoice_id": "INV-2026-001",
  "match_type": "exact",
  "confidence": 1.0,
  "confidence_level": "HIGH",
  "payment_status": "on_time",
  "days_late": 0,
  "action": "AUTO_RECONCILE",
  "reasons": [
    "Invoice reference 'INV-2026-001' explicitly matched in transaction reference",
    "Exact amount matched (USD 5000.00)",
    "Currency matched (USD)",
    "Customer name matched ('Acme Corporation')"
  ]
}
```
