import React, { useState, useEffect } from 'react';
import type {
  DashboardSummary,
  ReconciliationResult,
  EvaluationReport,
  Invoice,
  BankTransaction,
  DatasetStatus
} from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardSummaryView } from './components/DashboardSummary';
import { ReconciliationTable } from './components/ReconciliationTable';
import { TransactionDetailModal } from './components/TransactionDetailModal';
import { EvaluationView } from './components/EvaluationView';
import { DataInspector } from './components/DataInspector';
import { UploadDataset } from './components/UploadDataset';
import { AlertCircle } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'upload' | 'evaluation' | 'data'>('dashboard');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [results, setResults] = useState<ReconciliationResult[]>([]);
  const [evaluation, setEvaluation] = useState<EvaluationReport | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [datasetStatus, setDatasetStatus] = useState<DatasetStatus | null>(null);

  const [selectedTxn, setSelectedTxn] = useState<ReconciliationResult | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAllData = async () => {
    setErrorMsg(null);
    try {
      const [sumRes, recRes, invRes, txnRes, statusRes] = await Promise.all([
        fetch(`${API_BASE}/dashboard/summary`).then(r => r.json()),
        fetch(`${API_BASE}/reconciliation-results`).then(r => r.json()),
        fetch(`${API_BASE}/invoices`).then(r => r.json()),
        fetch(`${API_BASE}/transactions`).then(r => r.json()),
        fetch(`${API_BASE}/dataset/status`).then(r => r.json())
      ]);

      setSummary(sumRes);
      setResults(recRes);
      setInvoices(invRes);
      setTransactions(txnRes);
      setDatasetStatus(statusRes);

      // Fetch evaluation (may return 404 if ground truth is not uploaded)
      try {
        const evalResponse = await fetch(`${API_BASE}/evaluation`);
        if (evalResponse.ok) {
          const evalRes = await evalResponse.json();
          setEvaluation(evalRes);
        } else {
          setEvaluation(null);
        }
      } catch {
        setEvaluation(null);
      }
    } catch (err: any) {
      console.error("Failed to connect to backend:", err);
      setErrorMsg("Could not connect to FastAPI Backend at http://localhost:8000. Please ensure the server is running.");
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleTriggerReconciliation = async () => {
    setIsReconciling(true);
    try {
      await fetch(`${API_BASE}/reconcile`, { method: 'POST' });
      await fetchAllData();
    } catch (err) {
      console.error("Error triggering reconciliation:", err);
    } finally {
      setIsReconciling(false);
    }
  };

  const handleHumanReview = async (transactionId: string, status: string, targetInvoiceId?: string) => {
    try {
      await fetch(`${API_BASE}/review/${transactionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          target_invoice_id: targetInvoiceId || null,
          reviewer_notes: `Manual override via web UI`
        })
      });
      await fetchAllData();
      const updatedTxnRes = await fetch(`${API_BASE}/reconciliation/${transactionId}`).then(r => r.json());
      setSelectedTxn(updatedTxnRes);
    } catch (err) {
      console.error("Error submitting human review:", err);
    }
  };

  const handleDatasetUpdated = async () => {
    await fetchAllData();
    setActiveTab('dashboard');
  };

  return (
    <div className="app-layout">
      {/* Fixed Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        resultsCount={results.length}
        hasGroundTruth={Boolean(datasetStatus?.ground_truth_available)}
      />

      {/* Main Page Area */}
      <div className="app-main-content">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          datasetStatus={datasetStatus}
          isReconciling={isReconciling}
          onTriggerReconciliation={handleTriggerReconciliation}
        />

        {/* Dynamic View Canvas */}
        <main className="view-container">
          {/* Global Error Banner */}
          {errorMsg && (
            <div style={{
              backgroundColor: 'var(--critical-red-light)',
              border: '1px solid var(--critical-red-border)',
              color: 'var(--critical-red)',
              padding: '0.85rem 1.25rem',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{errorMsg}</span>
            </div>
          )}

          {/* Tab 1: Dashboard / Reconciliation Matrix */}
          {activeTab === 'dashboard' && (
            <>
              {/* 8 Neutral KPI Cards + Reconciliation Overview */}
              <DashboardSummaryView summary={summary} />

              {/* Primary Focus Transaction Table */}
              <ReconciliationTable
                results={results}
                onSelectTransaction={(txn) => setSelectedTxn(txn)}
                onGoToUpload={() => setActiveTab('upload')}
              />
            </>
          )}

          {/* Tab 2: Upload Dataset */}
          {activeTab === 'upload' && (
            <UploadDataset
              datasetStatus={datasetStatus}
              onDatasetUpdated={handleDatasetUpdated}
            />
          )}

          {/* Tab 3: Ground Truth Benchmark */}
          {activeTab === 'evaluation' && (
            <EvaluationView
              evaluation={evaluation}
              onGoToUpload={() => setActiveTab('upload')}
            />
          )}

          {/* Tab 4: Raw Dataset Inspector */}
          {activeTab === 'data' && (
            <DataInspector invoices={invoices} transactions={transactions} />
          )}

          {/* Transaction Detail Modal */}
          <TransactionDetailModal
            transaction={selectedTxn}
            invoices={invoices}
            onClose={() => setSelectedTxn(null)}
            onHumanReview={handleHumanReview}
          />
        </main>
      </div>
    </div>
  );
};
