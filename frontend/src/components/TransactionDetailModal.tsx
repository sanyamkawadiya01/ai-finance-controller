import React, { useState } from 'react';
import type { ReconciliationResult, Invoice } from '../types';
import { X } from 'lucide-react';

interface Props {
  transaction: ReconciliationResult | null;
  invoices: Invoice[];
  onClose: () => void;
  onHumanReview: (transactionId: string, status: string, targetInvoiceId?: string) => Promise<void>;
}

export const TransactionDetailModal: React.FC<Props> = ({ transaction, invoices, onClose, onHumanReview }) => {
  const [selectedAltInvoice, setSelectedAltInvoice] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!transaction) return null;

  const matchedInv = invoices.find(inv => inv.invoice_id === transaction.invoice_id);
  const fb = transaction.feature_breakdown;

  const handleAction = async (status: string, targetInvoiceId?: string) => {
    setIsSubmitting(true);
    try {
      await onHumanReview(transaction.transaction_id, status, targetInvoiceId);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
              Transaction Inspection — {transaction.transaction_id}
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Detailed AI Feature Breakdown & Human Review Decision
            </p>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Side-by-Side Comparison */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          {/* Bank Transaction Card */}
          <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: '#38bdf8', marginBottom: '0.75rem' }}>
              Bank Transaction
            </h3>
            <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div><strong style={{ color: '#94a3b8' }}>Txn ID:</strong> {transaction.transaction_id}</div>
              <div><strong style={{ color: '#94a3b8' }}>Date:</strong> {transaction.transaction_date}</div>
              <div><strong style={{ color: '#94a3b8' }}>Customer:</strong> {transaction.customer_name}</div>
              <div><strong style={{ color: '#94a3b8' }}>Amount:</strong> {transaction.currency} {transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            </div>
          </div>

          {/* Matched Invoice Card */}
          <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '0.875rem', textTransform: 'uppercase', color: '#818cf8', marginBottom: '0.75rem' }}>
              Matched Invoice Candidate
            </h3>
            {matchedInv ? (
              <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div><strong style={{ color: '#94a3b8' }}>Invoice ID:</strong> {matchedInv.invoice_id}</div>
                <div><strong style={{ color: '#94a3b8' }}>Customer:</strong> {matchedInv.customer_name}</div>
                <div><strong style={{ color: '#94a3b8' }}>Issue Date:</strong> {matchedInv.invoice_date} | <strong style={{ color: '#94a3b8' }}>Due Date:</strong> {matchedInv.due_date}</div>
                <div><strong style={{ color: '#94a3b8' }}>Amount:</strong> {matchedInv.currency} {matchedInv.invoice_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
              </div>
            ) : (
              <div style={{ color: '#64748b', fontSize: '0.875rem', padding: '1rem 0' }}>
                No candidate invoice currently assigned.
              </div>
            )}
          </div>
        </div>

        {/* AI Matching Analysis Breakdown */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>
              AI Feature Similarity Scores
            </h3>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: transaction.confidence >= 0.85 ? '#34d399' : transaction.confidence >= 0.60 ? '#fbbf24' : '#f43f5e' }}>
              Overall Confidence: {(transaction.confidence * 100).toFixed(0)}%
            </div>
          </div>

          {fb && (
            <div>
              <div className="feature-meter">
                <div className="feature-label">Amount Similarity</div>
                <div className="feature-track">
                  <div className="feature-fill" style={{ width: `${(fb.amount_similarity * 100).toFixed(0)}%` }} />
                </div>
                <div className="feature-score">{(fb.amount_similarity * 100).toFixed(0)}%</div>
              </div>

              <div className="feature-meter">
                <div className="feature-label">Customer Name Similarity</div>
                <div className="feature-track">
                  <div className="feature-fill" style={{ width: `${(fb.customer_name_similarity * 100).toFixed(0)}%` }} />
                </div>
                <div className="feature-score">{(fb.customer_name_similarity * 100).toFixed(0)}%</div>
              </div>

              <div className="feature-meter">
                <div className="feature-label">Reference Similarity</div>
                <div className="feature-track">
                  <div className="feature-fill" style={{ width: `${(fb.reference_similarity * 100).toFixed(0)}%` }} />
                </div>
                <div className="feature-score">{(fb.reference_similarity * 100).toFixed(0)}%</div>
              </div>

              <div className="feature-meter">
                <div className="feature-label">Description Similarity</div>
                <div className="feature-track">
                  <div className="feature-fill" style={{ width: `${(fb.description_similarity * 100).toFixed(0)}%` }} />
                </div>
                <div className="feature-score">{(fb.description_similarity * 100).toFixed(0)}%</div>
              </div>

              <div className="feature-meter">
                <div className="feature-label">Date Proximity Score</div>
                <div className="feature-track">
                  <div className="feature-fill" style={{ width: `${(fb.date_similarity * 100).toFixed(0)}%` }} />
                </div>
                <div className="feature-score">{(fb.date_similarity * 100).toFixed(0)}%</div>
              </div>
            </div>
          )}

          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem' }}>
              Decision Reasons
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.875rem' }}>
              {transaction.reasons.map((r, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: r.includes('mismatch') || r.includes('Insufficient') ? '#f43f5e' : '#34d399' }}>
                  <span>{r.includes('mismatch') || r.includes('Insufficient') ? '✗' : '✓'}</span> {r}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Human Review Decision Panel */}
        <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: '8px', border: '1px dashed var(--accent-purple)' }}>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#c084fc', marginBottom: '0.75rem' }}>
            Human Review Decision Override
          </h3>
          {transaction.human_override && (
            <div style={{ marginBottom: '0.75rem', color: '#34d399', fontSize: '0.875rem' }}>
              Current Status: <strong>{transaction.human_override.status}</strong>
            </div>
          )}
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <button
              disabled={isSubmitting}
              onClick={() => handleAction('ACCEPT')}
              style={{
                background: '#10b981', color: 'white', border: 'none', padding: '0.5rem 1rem',
                borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem'
              }}
            >
              Accept Suggestion
            </button>

            <button
              disabled={isSubmitting}
              onClick={() => handleAction('REJECT')}
              style={{
                background: '#f43f5e', color: 'white', border: 'none', padding: '0.5rem 1rem',
                borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem'
              }}
            >
              Reject Suggestion
            </button>

            <button
              disabled={isSubmitting}
              onClick={() => handleAction('MARK_UNMATCHED')}
              style={{
                background: '#64748b', color: 'white', border: 'none', padding: '0.5rem 1rem',
                borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem'
              }}
            >
              Mark Unmatched
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
              <select
                className="select-filter"
                value={selectedAltInvoice}
                onChange={(e) => setSelectedAltInvoice(e.target.value)}
              >
                <option value="">Reassign Invoice...</option>
                {invoices.map(inv => (
                  <option key={inv.invoice_id} value={inv.invoice_id}>
                    {inv.invoice_id} - {inv.customer_name} (${inv.invoice_amount})
                  </option>
                ))}
              </select>
              <button
                disabled={isSubmitting || !selectedAltInvoice}
                onClick={() => handleAction('REASSIGN', selectedAltInvoice)}
                style={{
                  background: '#6366f1', color: 'white', border: 'none', padding: '0.5rem 0.875rem',
                  borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem'
                }}
              >
                Reassign
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
