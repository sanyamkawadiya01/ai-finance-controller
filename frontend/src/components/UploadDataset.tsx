import React, { useState } from 'react';
import type { DatasetStatus, DatasetUploadResponse } from '../types';
import { Upload, CheckCircle2, AlertCircle, RefreshCw, FileSpreadsheet, RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  datasetStatus: DatasetStatus | null;
  onDatasetUpdated: () => Promise<void>;
}

export const UploadDataset: React.FC<Props> = ({ datasetStatus, onDatasetUpdated }) => {
  const [invoicesFile, setInvoicesFile] = useState<File | null>(null);
  const [transactionsFile, setTransactionsFile] = useState<File | null>(null);
  const [groundTruthFile, setGroundTruthFile] = useState<File | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [uploadResult, setUploadResult] = useState<DatasetUploadResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setUploadResult(null);

    if (!invoicesFile || !transactionsFile) {
      setErrorMsg("Please select both Invoices CSV and Bank Transactions CSV files.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('invoices_file', invoicesFile);
      formData.append('transactions_file', transactionsFile);
      if (groundTruthFile) {
        formData.append('ground_truth_file', groundTruthFile);
      }

      const res = await fetch('http://localhost:8000/api/dataset/upload', {
        method: 'POST',
        body: formData,
      });

      const data: DatasetUploadResponse = await res.json();
      setUploadResult(data);

      if (data.success) {
        await onDatasetUpdated();
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setErrorMsg("Failed to upload dataset. Please ensure backend server is running.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    setErrorMsg(null);
    setUploadResult(null);
    try {
      await fetch('http://localhost:8000/api/dataset/reset', { method: 'POST' });
      setInvoicesFile(null);
      setTransactionsFile(null);
      setGroundTruthFile(null);
      await onDatasetUpdated();
    } catch (err) {
      console.error("Reset error:", err);
      setErrorMsg("Failed to load sample dataset.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleClear = async () => {
    setIsResetting(true);
    setErrorMsg(null);
    setUploadResult(null);
    try {
      await fetch('http://localhost:8000/api/dataset/clear', { method: 'POST' });
      setInvoicesFile(null);
      setTransactionsFile(null);
      setGroundTruthFile(null);
      await onDatasetUpdated();
    } catch (err) {
      console.error("Clear error:", err);
      setErrorMsg("Failed to clear dataset.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
      {/* Upload Form Card */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <Upload size={22} style={{ color: '#38bdf8' }} />
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#f8fafc' }}>
            Upload Custom Dataset
          </h2>
        </div>

        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Invoices File Field */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
              Invoices CSV <span style={{ color: '#f43f5e' }}>*</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="file"
                accept=".csv"
                id="invoices-input"
                style={{ display: 'none' }}
                onChange={(e) => setInvoicesFile(e.target.files?.[0] || null)}
              />
              <label
                htmlFor="invoices-input"
                style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px border-subtle',
                  borderStyle: 'dashed',
                  borderColor: invoicesFile ? '#38bdf8' : 'var(--border-subtle)',
                  padding: '0.625rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: invoicesFile ? '#38bdf8' : '#94a3b8',
                  flexGrow: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <FileSpreadsheet size={18} />
                {invoicesFile ? invoicesFile.name : 'Choose Invoices CSV...'}
              </label>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
              Required columns: invoice_id, customer_id, customer_name, invoice_date, due_date, invoice_amount, currency
            </span>
          </div>

          {/* Bank Transactions File Field */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
              Bank Transactions CSV <span style={{ color: '#f43f5e' }}>*</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="file"
                accept=".csv"
                id="transactions-input"
                style={{ display: 'none' }}
                onChange={(e) => setTransactionsFile(e.target.files?.[0] || null)}
              />
              <label
                htmlFor="transactions-input"
                style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px border-subtle',
                  borderStyle: 'dashed',
                  borderColor: transactionsFile ? '#38bdf8' : 'var(--border-subtle)',
                  padding: '0.625rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: transactionsFile ? '#38bdf8' : '#94a3b8',
                  flexGrow: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <FileSpreadsheet size={18} />
                {transactionsFile ? transactionsFile.name : 'Choose Bank Transactions CSV...'}
              </label>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
              Required columns: transaction_id, transaction_date, description, customer_name, reference, amount, currency
            </span>
          </div>

          {/* Ground Truth File Field (Optional) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.35rem' }}>
              Ground Truth CSV <span style={{ color: '#64748b', fontWeight: 400 }}>(Optional)</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="file"
                accept=".csv"
                id="ground-truth-input"
                style={{ display: 'none' }}
                onChange={(e) => setGroundTruthFile(e.target.files?.[0] || null)}
              />
              <label
                htmlFor="ground-truth-input"
                style={{
                  background: 'rgba(30, 41, 59, 0.8)',
                  border: '1px border-subtle',
                  borderStyle: 'dashed',
                  borderColor: groundTruthFile ? '#c084fc' : 'var(--border-subtle)',
                  padding: '0.625rem 1rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  color: groundTruthFile ? '#c084fc' : '#94a3b8',
                  flexGrow: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <FileSpreadsheet size={18} />
                {groundTruthFile ? groundTruthFile.name : 'Choose Ground Truth CSV (Optional)...'}
              </label>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
              Required columns if uploaded: transaction_id, invoice_id, match_type, payment_status, is_duplicate
            </span>
          </div>

          {errorMsg && (
            <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid #f43f5e', color: '#f43f5e', padding: '0.75rem', borderRadius: '6px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} />
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={isUploading || !invoicesFile || !transactionsFile}
            className="action-btn"
            style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}
          >
            <RefreshCw size={16} className={isUploading ? 'animate-spin' : ''} />
            {isUploading ? 'Validating & Uploading...' : 'Validate & Upload Dataset'}
          </button>
        </form>
      </div>

      {/* Active Dataset Status & Validation Results Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Active Dataset Card */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc' }}>
              Currently Active Dataset Status
            </h3>
            {datasetStatus && (
              <span style={{
                background: datasetStatus.source === 'uploaded' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                color: datasetStatus.source === 'uploaded' ? '#c084fc' : '#f59e0b',
                padding: '0.25rem 0.625rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600,
                textTransform: 'uppercase'
              }}>
                {datasetStatus.source === 'uploaded' ? 'Active User Dataset' : 'No Dataset'}
              </span>
            )}
          </div>

          {datasetStatus ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: '#94a3b8' }}>Total Invoices:</span>
                <strong style={{ color: '#38bdf8' }}>{datasetStatus.invoices_count}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: '#94a3b8' }}>Bank Transactions:</span>
                <strong style={{ color: '#818cf8' }}>{datasetStatus.transactions_count}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: '#94a3b8' }}>Ground Truth Benchmark:</span>
                <strong style={{ color: datasetStatus.ground_truth_available ? '#34d399' : '#f59e0b' }}>
                  {datasetStatus.ground_truth_available ? 'Available ✓' : 'Not Uploaded (Disabled)'}
                </strong>
              </div>

              {datasetStatus.source !== 'none' && (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isResetting}
                  style={{
                    marginTop: '0.5rem',
                    background: 'rgba(244, 63, 94, 0.15)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    color: '#fb7185',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <RotateCcw size={14} className={isResetting ? 'animate-spin' : ''} />
                  Clear Current Dataset
                </button>
              )}
            </div>
          ) : (
            <div style={{ color: '#64748b', fontSize: '0.875rem' }}>Loading dataset status...</div>
          )}
        </div>

        {/* Validation Result Box */}
        {uploadResult && (
          <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: uploadResult.success ? '4px solid #10b981' : '4px solid #f43f5e' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {uploadResult.success ? (
                <CheckCircle2 size={20} style={{ color: '#34d399' }} />
              ) : (
                <AlertCircle size={20} style={{ color: '#f43f5e' }} />
              )}
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: uploadResult.success ? '#34d399' : '#f43f5e' }}>
                {uploadResult.success ? '✓ Dataset Valid & Pipeline Loaded' : '✗ Dataset Validation Errors'}
              </h4>
            </div>

            {uploadResult.success ? (
              <div style={{ fontSize: '0.875rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div>Invoices Loaded: <strong>{uploadResult.invoices_count}</strong></div>
                <div>Bank Transactions Loaded: <strong>{uploadResult.transactions_count}</strong></div>
                <div>Ground Truth Records: <strong>{uploadResult.ground_truth_available ? uploadResult.ground_truth_count : 'None'}</strong></div>
              </div>
            ) : (
              <div style={{ marginTop: '0.5rem' }}>
                <strong style={{ fontSize: '0.8125rem', color: '#f43f5e', textTransform: 'uppercase' }}>Errors:</strong>
                <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', color: '#fb7185', fontSize: '0.8125rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {uploadResult.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {uploadResult.warnings.length > 0 && (
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#fbbf24', fontSize: '0.8125rem', fontWeight: 600 }}>
                  <AlertTriangle size={14} /> Warnings ({uploadResult.warnings.length}):
                </div>
                <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', color: '#fbbf24', fontSize: '0.8125rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {uploadResult.warnings.map((warn, idx) => (
                    <li key={idx}>{warn}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
