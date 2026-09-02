import React, { useState, useEffect } from 'react';
import type {
  DashboardSummary,
  ReconciliationResult,
  EvaluationReport,
  Invoice,
  BankTransaction
} from './types';
import { DashboardSummaryView } from './components/DashboardSummary';
import { ReconciliationTable } from './components/ReconciliationTable';
import { TransactionDetailModal } from './components/TransactionDetailModal';
import { EvaluationView } from './components/EvaluationView';
import { DataInspector } from './components/DataInspector';
import {
  Bot,
  RefreshCw,
  LayoutDashboard,
  Award,
  Database,
  AlertCircle
} from 'lucide-react';

const API_BASE = 'http://localhost:8000/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'evaluation' | 'data'>('dashboard');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [results, setResults] = useState<ReconciliationResult[]>([]);
  const [evaluation, setEvaluation] = useState<EvaluationReport | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);

  const [selectedTxn, setSelectedTxn] = useState<ReconciliationResult | null>(null);
  const [isReconciling, setIsReconciling] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchAllData = async () => {
    setErrorMsg(null);
    try {
      const [sumRes, recRes, evalRes, invRes, txnRes] = await Promise.all([
        fetch(`${API_BASE}/dashboard/summary`).then(r => r.json()),
        fetch(`${API_BASE}/reconciliation-results`).then(r => r.json()),
        fetch(`${API_BASE}/evaluation`).then(r => r.json()),
        fetch(`${API_BASE}/invoices`).then(r => r.json()),
        fetch(`${API_BASE}/transactions`).then(r => r.json())
      ]);

      setSummary(sumRes);
      setResults(recRes);
      setEvaluation(evalRes);
      setInvoices(invRes);
      setTransactions(txnRes);
    } catch (err: any) {
      console.error("Failed to connect to backend:", err);
      setErrorMsg("Could not connect to FastAPI Backend at http://localhost:8000. Please ensure server is running.");
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

  return (
    <div className="app-container">
      {/* App Header */}
      <header className="app-header">
        <div>
          <div className="brand-title">
            <Bot size={28} style={{ color: '#38bdf8' }} />
            <span>AI Finance Controller</span>
          </div>
          <p className="brand-subtitle">
            Deterministic Rule-Based + AI/Fuzzy Payment Reconciliation Engine
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.1)', padding: '0.35rem 0.75rem', borderRadius: '9999px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
            API Connected
          </div>

          <button
            className="action-btn"
            onClick={handleTriggerReconciliation}
            disabled={isReconciling}
          >
            <RefreshCw size={16} className={isReconciling ? 'animate-spin' : ''} />
            {isReconciling ? 'Reconciling...' : 'Run Pipeline'}
          </button>
        </div>
      </header>

      {errorMsg && (
        <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid #f43f5e', color: '#f43f5e', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={20} />
          {errorMsg}
        </div>
      )}

      {/* Summary KPI Section */}
      <DashboardSummaryView summary={summary} />

      {/* Tabs Navigation */}
      <nav className="tabs-nav">
        <button
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <LayoutDashboard size={18} />
          Reconciliation Table
        </button>

        <button
          className={`tab-btn ${activeTab === 'evaluation' ? 'active' : ''}`}
          onClick={() => setActiveTab('evaluation')}
        >
          <Award size={18} />
          Ground Truth Evaluation
        </button>

        <button
          className={`tab-btn ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => setActiveTab('data')}
        >
          <Database size={18} />
          Raw Dataset Inspector
        </button>
      </nav>

      {/* Tab Views */}
      {activeTab === 'dashboard' && (
        <ReconciliationTable
          results={results}
          onSelectTransaction={(txn) => setSelectedTxn(txn)}
        />
      )}

      {activeTab === 'evaluation' && (
        <EvaluationView evaluation={evaluation} />
      )}

      {activeTab === 'data' && (
        <DataInspector invoices={invoices} transactions={transactions} />
      )}

      {/* Transaction Detail Modal Drawer */}
      <TransactionDetailModal
        transaction={selectedTxn}
        invoices={invoices}
        onClose={() => setSelectedTxn(null)}
        onHumanReview={handleHumanReview}
      />
    </div>
  );
};
