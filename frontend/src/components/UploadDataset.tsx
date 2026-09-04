import React, { useState } from 'react';
import type { DatasetStatus, DatasetUploadResponse } from '../types';
import { Upload, CheckCircle2, AlertCircle, FileSpreadsheet, RotateCcw, X, Database } from 'lucide-react';

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
    <div className="upload-grid">
      {/* Step-Based Upload Form */}
      <form onSubmit={handleUpload} className="upload-cards-container">
        {/* Card 1: Invoices CSV */}
        <div className="upload-card">
          <div className="upload-card-header">
            <div className="upload-card-title-group">
              <div className="step-number-badge">1</div>
              <span className="upload-title">Invoices CSV</span>
            </div>
            <span className="req-badge required">Required</span>
          </div>

          {!invoicesFile ? (
            <label htmlFor="invoices-input" className="file-dropzone-label">
              <input
                type="file"
                accept=".csv"
                id="invoices-input"
                style={{ display: 'none' }}
                onChange={(e) => setInvoicesFile(e.target.files?.[0] || null)}
              />
              <div className="dropzone-box">
                <FileSpreadsheet size={24} color="var(--primary-blue)" />
                <div className="dropzone-text">
                  <strong>Click to select</strong> or drag and drop Invoices CSV
                </div>
              </div>
            </label>
          ) : (
            <div className="selected-file-row">
              <div className="file-info-group">
                <CheckCircle2 size={18} color="var(--primary-blue)" />
                <span className="file-name">{invoicesFile.name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  ({(invoicesFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                type="button"
                className="clear-btn"
                onClick={() => setInvoicesFile(null)}
                title="Remove file"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Expected Columns:</span>
            <div className="expected-columns-pills">
              <span className="column-pill">invoice_id</span>
              <span className="column-pill">customer_id</span>
              <span className="column-pill">customer_name</span>
              <span className="column-pill">invoice_date</span>
              <span className="column-pill">due_date</span>
              <span className="column-pill">invoice_amount</span>
              <span className="column-pill">currency</span>
            </div>
          </div>
        </div>

        {/* Card 2: Bank Transactions CSV */}
        <div className="upload-card">
          <div className="upload-card-header">
            <div className="upload-card-title-group">
              <div className="step-number-badge">2</div>
              <span className="upload-title">Bank Transactions CSV</span>
            </div>
            <span className="req-badge required">Required</span>
          </div>

          {!transactionsFile ? (
            <label htmlFor="transactions-input" className="file-dropzone-label">
              <input
                type="file"
                accept=".csv"
                id="transactions-input"
                style={{ display: 'none' }}
                onChange={(e) => setTransactionsFile(e.target.files?.[0] || null)}
              />
              <div className="dropzone-box">
                <FileSpreadsheet size={24} color="var(--primary-blue)" />
                <div className="dropzone-text">
                  <strong>Click to select</strong> or drag and drop Bank Transactions CSV
                </div>
              </div>
            </label>
          ) : (
            <div className="selected-file-row">
              <div className="file-info-group">
                <CheckCircle2 size={18} color="var(--primary-blue)" />
                <span className="file-name">{transactionsFile.name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  ({(transactionsFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                type="button"
                className="clear-btn"
                onClick={() => setTransactionsFile(null)}
                title="Remove file"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Expected Columns:</span>
            <div className="expected-columns-pills">
              <span className="column-pill">transaction_id</span>
              <span className="column-pill">transaction_date</span>
              <span className="column-pill">description</span>
              <span className="column-pill">customer_name</span>
              <span className="column-pill">reference</span>
              <span className="column-pill">amount</span>
              <span className="column-pill">currency</span>
            </div>
          </div>
        </div>

        {/* Card 3: Ground Truth CSV (Optional) */}
        <div className="upload-card">
          <div className="upload-card-header">
            <div className="upload-card-title-group">
              <div className="step-number-badge" style={{ backgroundColor: 'var(--secondary-purple-light)', color: 'var(--secondary-purple)' }}>3</div>
              <span className="upload-title">Ground Truth CSV</span>
            </div>
            <span className="req-badge optional">Optional Benchmark</span>
          </div>

          {!groundTruthFile ? (
            <label htmlFor="ground-truth-input" className="file-dropzone-label">
              <input
                type="file"
                accept=".csv"
                id="ground-truth-input"
                style={{ display: 'none' }}
                onChange={(e) => setGroundTruthFile(e.target.files?.[0] || null)}
              />
              <div className="dropzone-box">
                <FileSpreadsheet size={24} color="var(--secondary-purple)" />
                <div className="dropzone-text">
                  <strong>Click to select</strong> Ground Truth CSV (Optional)
                </div>
              </div>
            </label>
          ) : (
            <div className="selected-file-row" style={{ backgroundColor: 'var(--secondary-purple-light)', borderColor: 'var(--secondary-purple-border)' }}>
              <div className="file-info-group">
                <CheckCircle2 size={18} color="var(--secondary-purple)" />
                <span className="file-name" style={{ color: 'var(--secondary-purple)' }}>{groundTruthFile.name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  ({(groundTruthFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <button
                type="button"
                className="clear-btn"
                onClick={() => setGroundTruthFile(null)}
                title="Remove file"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Expected Columns:</span>
            <div className="expected-columns-pills">
              <span className="column-pill">transaction_id</span>
              <span className="column-pill">invoice_id</span>
              <span className="column-pill">match_type</span>
              <span className="column-pill">payment_status</span>
              <span className="column-pill">is_duplicate</span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div style={{
            backgroundColor: 'var(--critical-red-light)',
            border: '1px solid var(--critical-red-border)',
            color: 'var(--critical-red)',
            padding: '0.85rem 1rem',
            borderRadius: '8px',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={isUploading || !invoicesFile || !transactionsFile}
          className="btn-primary"
          style={{ width: '100%', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <Upload size={18} className={isUploading ? 'animate-spin' : ''} />
          {isUploading ? 'Validating & Uploading...' : 'Upload & Validate Dataset'}
        </button>
      </form>

      {/* Active Dataset Status & Validation Side Panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="white-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
            <Database size={18} color="var(--primary-blue)" />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Active Dataset Pipeline Status
            </h3>
          </div>

          {datasetStatus ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Dataset Source:</span>
                <span className="badge badge-exact" style={{ textTransform: 'capitalize' }}>
                  {datasetStatus.source === 'uploaded' ? 'Custom Upload' : 'Sample Default'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Invoices:</span>
                <strong className="code-identifier">{datasetStatus.invoices_count} records</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Bank Transactions:</span>
                <strong className="code-identifier" style={{ color: 'var(--secondary-purple)' }}>{datasetStatus.transactions_count} records</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Ground Truth Benchmark:</span>
                <strong style={{ color: datasetStatus.ground_truth_available ? 'var(--success-green)' : 'var(--warning-amber)' }}>
                  {datasetStatus.ground_truth_available ? 'Available ✓' : 'Not Uploaded'}
                </strong>
              </div>

              <button
                type="button"
                onClick={handleClear}
                disabled={isResetting}
                style={{
                  marginTop: '0.5rem',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  padding: '0.5rem 0.85rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem'
                }}
              >
                <RotateCcw size={14} className={isResetting ? 'animate-spin' : ''} />
                Reset to Sample Dataset
              </button>
            </div>
          ) : (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Loading dataset status...</div>
          )}
        </div>

        {uploadResult && (
          <div className="white-card" style={{ borderLeft: uploadResult.success ? '4px solid var(--success-green)' : '4px solid var(--critical-red)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {uploadResult.success ? (
                <CheckCircle2 size={20} color="var(--success-green)" />
              ) : (
                <AlertCircle size={20} color="var(--critical-red)" />
              )}
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: uploadResult.success ? 'var(--success-green)' : 'var(--critical-red)' }}>
                {uploadResult.success ? 'Schema Validated & Loaded' : 'Validation Error'}
              </h4>
            </div>

            {uploadResult.success ? (
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <div>Invoices: <strong>{uploadResult.invoices_count}</strong></div>
                <div>Transactions: <strong>{uploadResult.transactions_count}</strong></div>
                <div>Ground Truth: <strong>{uploadResult.ground_truth_available ? uploadResult.ground_truth_count : 'None'}</strong></div>
              </div>
            ) : (
              <ul style={{ paddingLeft: '1rem', color: 'var(--critical-red)', fontSize: '0.8125rem' }}>
                {uploadResult.errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
