import os
from fastapi import FastAPI, HTTPException, Path
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any

from backend.app.schemas.schemas import (
    InvoiceSchema,
    BankTransactionSchema,
    ReconciliationResultSchema,
    DashboardSummarySchema,
    EvaluationReportSchema,
    HumanReviewRequestSchema
)
from backend.app.services.pipeline import ReconciliationPipeline

app = FastAPI(
    title="AI Finance Controller - Payment Reconciliation API",
    description="Deterministic & AI-assisted payment reconciliation engine with ground truth evaluation and human review.",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize global pipeline instance pointing to local data directory
DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data"))
pipeline = ReconciliationPipeline(data_dir=DATA_DIR)

@app.on_event("startup")
def startup_event():
    # Initial run of pipeline on server startup
    pipeline.run_pipeline()

@app.get("/api/health", tags=["System"])
def health_check():
    return {"status": "ok", "service": "AI Finance Controller Engine"}

@app.get("/api/invoices", response_model=List[InvoiceSchema], tags=["Data Ingestion"])
def get_invoices():
    pipeline.load_data()
    return pipeline.invoices_list

@app.get("/api/transactions", response_model=List[BankTransactionSchema], tags=["Data Ingestion"])
def get_transactions():
    pipeline.load_data()
    return pipeline.transactions_list

@app.post("/api/reconcile", response_model=List[ReconciliationResultSchema], tags=["Reconciliation"])
def trigger_reconciliation():
    """Triggers end-to-end reconciliation pipeline execution across all transactions."""
    results = pipeline.run_pipeline()
    return results

@app.get("/api/reconciliation-results", response_model=List[ReconciliationResultSchema], tags=["Reconciliation"])
def get_reconciliation_results():
    if not pipeline.latest_results:
        pipeline.run_pipeline()
    return pipeline.latest_results

@app.get("/api/reconciliation/{transaction_id}", response_model=ReconciliationResultSchema, tags=["Reconciliation"])
def get_transaction_detail(transaction_id: str = Path(..., description="The bank transaction ID")):
    if not pipeline.latest_results:
        pipeline.run_pipeline()
    for res in pipeline.latest_results:
        if res.transaction_id.lower() == transaction_id.lower():
            return res
    raise HTTPException(status_code=404, detail=f"Transaction '{transaction_id}' not found")

@app.get("/api/dashboard/summary", response_model=DashboardSummarySchema, tags=["Dashboard"])
def get_dashboard_summary():
    return pipeline.get_summary()

@app.get("/api/evaluation", response_model=EvaluationReportSchema, tags=["Evaluation"])
def get_evaluation():
    return pipeline.evaluate()

@app.post("/api/review/{transaction_id}", response_model=ReconciliationResultSchema, tags=["Human Review"])
def submit_human_review(transaction_id: str, review: HumanReviewRequestSchema):
    """
    Store human review decision for medium/low confidence matches.
    Supports ACCEPT, REJECT, REASSIGN, MARK_UNMATCHED.
    """
    if not pipeline.latest_results:
        pipeline.run_pipeline()

    txn_found = False
    for res in pipeline.latest_results:
        if res.transaction_id.lower() == transaction_id.lower():
            txn_found = True
            break
    
    if not txn_found:
        raise HTTPException(status_code=404, detail=f"Transaction '{transaction_id}' not found")

    pipeline.human_overrides[transaction_id] = review.dict()
    # Re-run pipeline to re-calculate state with human overrides
    pipeline.run_pipeline()

    # Return updated result
    for res in pipeline.latest_results:
        if res.transaction_id.lower() == transaction_id.lower():
            return res

    raise HTTPException(status_code=500, detail="Error applying human review override")
