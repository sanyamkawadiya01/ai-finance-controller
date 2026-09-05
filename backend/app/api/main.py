import os
import io
import datetime
import pandas as pd
from fastapi import FastAPI, HTTPException, Path, File, UploadFile, Response
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional

from backend.app.schemas.schemas import (
    InvoiceSchema,
    BankTransactionSchema,
    ReconciliationResultSchema,
    DashboardSummarySchema,
    EvaluationReportSchema,
    HumanReviewRequestSchema,
    DatasetUploadResponseSchema,
    DatasetStatusSchema
)
from backend.app.services.pipeline import ReconciliationPipeline
from backend.app.services.validation.validator import DatasetValidator
from backend.app.services.reports.report_generator import PDFReportGenerator, ExcelReportGenerator

app = FastAPI(
    title="AI Finance Controller - Payment Reconciliation API",
    description="Deterministic & AI-assisted payment reconciliation engine with dataset upload and evaluation.",
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
UPLOADS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
pipeline = ReconciliationPipeline(data_dir=None)

@app.on_event("startup")
def startup_event():
    # Initial startup starts with no active dataset until user uploads
    pipeline.set_dataset_source("none")

@app.get("/api/health", tags=["System"])
def health_check():
    return {"status": "ok", "service": "AI Finance Controller Engine"}

@app.get("/api/dataset/status", response_model=DatasetStatusSchema, tags=["Dataset"])
def get_dataset_status():
    pipeline.load_data()
    return DatasetStatusSchema(
        active=pipeline.source != "none",
        source=pipeline.source,
        invoices_count=len(pipeline.invoices_list),
        transactions_count=len(pipeline.transactions_list),
        ground_truth_available=bool(pipeline.ground_truth_list)
    )

@app.post("/api/dataset/upload", response_model=DatasetUploadResponseSchema, tags=["Dataset"])
async def upload_dataset(
    invoices_file: UploadFile = File(...),
    transactions_file: UploadFile = File(...),
    ground_truth_file: Optional[UploadFile] = File(None)
):
    # Validate file format extensions
    for file_obj, name in [(invoices_file, "Invoices"), (transactions_file, "Bank Transactions")]:
        if file_obj and file_obj.filename and not file_obj.filename.lower().endswith(".csv"):
            return DatasetUploadResponseSchema(
                success=False,
                invoices_count=0,
                transactions_count=0,
                errors=[f"{name} file must be a .csv file (received '{file_obj.filename}')"]
            )
    if ground_truth_file and ground_truth_file.filename and not ground_truth_file.filename.lower().endswith(".csv"):
        return DatasetUploadResponseSchema(
            success=False,
            invoices_count=0,
            transactions_count=0,
            errors=[f"Ground truth file must be a .csv file (received '{ground_truth_file.filename}')"]
        )

    # Read bytes and parse DataFrames
    try:
        inv_content = await invoices_file.read()
        df_inv = pd.read_csv(io.BytesIO(inv_content)).fillna("")
    except Exception as e:
        return DatasetUploadResponseSchema(success=False, invoices_count=0, transactions_count=0, errors=[f"Failed to parse Invoices CSV: {str(e)}"])

    try:
        txn_content = await transactions_file.read()
        df_txn = pd.read_csv(io.BytesIO(txn_content)).fillna("")
    except Exception as e:
        return DatasetUploadResponseSchema(success=False, invoices_count=len(df_inv), transactions_count=0, errors=[f"Failed to parse Bank Transactions CSV: {str(e)}"])

    df_gt = None
    gt_content = None
    if ground_truth_file and ground_truth_file.filename:
        try:
            gt_content = await ground_truth_file.read()
            if gt_content and len(gt_content.strip()) > 0:
                df_gt = pd.read_csv(io.BytesIO(gt_content)).fillna("")
        except Exception as e:
            return DatasetUploadResponseSchema(success=False, invoices_count=len(df_inv), transactions_count=len(df_txn), errors=[f"Failed to parse Ground Truth CSV: {str(e)}"])

    # Validate DataFrames using DatasetValidator
    all_errors = []
    all_warnings = []

    inv_errs, inv_warns = DatasetValidator.validate_invoices_df(df_inv)
    all_errors.extend(inv_errs)
    all_warnings.extend(inv_warns)

    txn_errs, txn_warns = DatasetValidator.validate_transactions_df(df_txn)
    all_errors.extend(txn_errs)
    all_warnings.extend(txn_warns)

    valid_txn_ids = set(df_txn["transaction_id"].astype(str)) if "transaction_id" in df_txn.columns else set()
    valid_inv_ids = set(df_inv["invoice_id"].astype(str)) if "invoice_id" in df_inv.columns else set()

    if df_gt is not None:
        gt_errs, gt_warns = DatasetValidator.validate_ground_truth_df(df_gt, valid_txn_ids, valid_inv_ids)
        all_errors.extend(gt_errs)
        all_warnings.extend(gt_warns)

    if all_errors:
        return DatasetUploadResponseSchema(
            success=False,
            invoices_count=len(df_inv),
            transactions_count=len(df_txn),
            ground_truth_count=len(df_gt) if df_gt is not None else 0,
            ground_truth_available=df_gt is not None,
            errors=all_errors,
            warnings=all_warnings
        )

    # Save CSV files to uploads directory
    os.makedirs(UPLOADS_DIR, exist_ok=True)
    with open(os.path.join(UPLOADS_DIR, "invoices.csv"), "wb") as f:
        f.write(inv_content)
    with open(os.path.join(UPLOADS_DIR, "bank_transactions.csv"), "wb") as f:
        f.write(txn_content)
    
    gt_saved = False
    gt_file_path = os.path.join(UPLOADS_DIR, "ground_truth.csv")
    if gt_content and df_gt is not None and not df_gt.empty:
        with open(gt_file_path, "wb") as f:
            f.write(gt_content)
        gt_saved = True
    else:
        if os.path.exists(gt_file_path):
            os.remove(gt_file_path)

    # Re-initialize pipeline with uploaded dataset
    pipeline.set_dataset_source("uploaded", UPLOADS_DIR)
    pipeline.run_pipeline()

    return DatasetUploadResponseSchema(
        success=True,
        source="uploaded",
        invoices_count=len(pipeline.invoices_list),
        transactions_count=len(pipeline.transactions_list),
        ground_truth_count=len(pipeline.ground_truth_list),
        ground_truth_available=gt_saved,
        errors=[],
        warnings=all_warnings
    )

@app.post("/api/dataset/reset", response_model=DatasetStatusSchema, tags=["Dataset"])
def reset_dataset():
    return clear_dataset()

@app.post("/api/dataset/clear", response_model=DatasetStatusSchema, tags=["Dataset"])
def clear_dataset():
    if os.path.exists(UPLOADS_DIR):
        for f in os.listdir(UPLOADS_DIR):
            file_path = os.path.join(UPLOADS_DIR, f)
            if os.path.isfile(file_path):
                try:
                    os.remove(file_path)
                except Exception:
                    pass
    pipeline.set_dataset_source("none")
    pipeline.run_pipeline()
    return DatasetStatusSchema(
        active=False,
        source="none",
        invoices_count=0,
        transactions_count=0,
        ground_truth_available=False
    )

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

@app.get("/api/evaluation", response_model=Optional[EvaluationReportSchema], tags=["Evaluation"])
def get_evaluation():
    eval_res = pipeline.evaluate()
    if eval_res is None:
        raise HTTPException(
            status_code=404, 
            detail="Evaluation unavailable. Upload ground_truth.csv to evaluate model performance."
        )
    return eval_res

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

@app.post("/api/reports/pdf", tags=["Reports"])
def generate_pdf_report():
    if not pipeline.invoices_list and not pipeline.transactions_list:
        pipeline.load_data()

    if not pipeline.invoices_list and not pipeline.transactions_list:
        raise HTTPException(status_code=400, detail="No active dataset found to generate report. Please load or upload a dataset first.")

    if not pipeline.latest_results:
        pipeline.run_pipeline()

    summary = pipeline.get_summary()
    results = pipeline.latest_results
    invoices = pipeline.invoices_list
    transactions = pipeline.transactions_list
    evaluation = pipeline.evaluate()

    pdf_bytes = PDFReportGenerator.generate(
        summary=summary,
        results=results,
        invoices=invoices,
        transactions=transactions,
        evaluation=evaluation,
        dataset_source=pipeline.source
    )

    filename = f"AI_Finance_Controller_Report_{datetime.datetime.now().strftime('%Y-%m-%d')}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

@app.post("/api/reports/excel", tags=["Reports"])
def generate_excel_report():
    if not pipeline.invoices_list and not pipeline.transactions_list:
        pipeline.load_data()

    if not pipeline.invoices_list and not pipeline.transactions_list:
        raise HTTPException(status_code=400, detail="No active dataset found to generate report. Please load or upload a dataset first.")

    if not pipeline.latest_results:
        pipeline.run_pipeline()

    summary = pipeline.get_summary()
    results = pipeline.latest_results
    invoices = pipeline.invoices_list
    transactions = pipeline.transactions_list
    evaluation = pipeline.evaluate()

    excel_bytes = ExcelReportGenerator.generate(
        summary=summary,
        results=results,
        invoices=invoices,
        transactions=transactions,
        evaluation=evaluation,
        dataset_source=pipeline.source
    )

    filename = f"AI_Finance_Controller_Report_{datetime.datetime.now().strftime('%Y-%m-%d')}.xlsx"
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )

