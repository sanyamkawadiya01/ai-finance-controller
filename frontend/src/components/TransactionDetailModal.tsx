import React, { useState } from 'react';
import type { ReconciliationResult, Invoice } from '../types';
import { X, ShieldCheck, UserCheck, Check, AlertTriangle } from 'lucide-react';

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
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <span className="badge badge-partial">INSPECTION CONSOLE</span>
              <h2 className="code-identifier" style={{ fontSize: '1.25rem' }}>
                {transaction.transaction_id}
              </h2>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', marginTop: '0.2rem' }}>
              AI Similarity Vectors & Human Review Override Console
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} title="Close Inspection">
            <X size={18} />
          </button>
        </div>

        {/* Side-by-Side Comparison Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
          {/* Bank Transaction Card */}
          <div style={{
            backgroundColor: 'var(--bg-canvas)',
            padding: '1.15rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-blue)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Bank Transaction Record
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Source Statement</span>
            </div>
            <div style={{ fontSize: '0.84rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Txn ID:</span>
                <strong className="code-identifier">{transaction.transaction_id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Transaction Date:</span>
                <span>{transaction.transaction_date}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Customer Name:</span>
                <strong style={{ color: 'var(--text-main)' }}>{transaction.customer_name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.4rem', borderTop: '1px dashed var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Amount Received:</span>
                <strong style={{ color: 'var(--success-green)', fontSize: '1rem' }} className="amount-cell">
                  {transaction.currency === 'INR' || !transaction.currency ? '₹' : transaction.currency} {transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </strong>
              </div>
            </div>
          </div>

          {/* Matched Invoice Card */}
          <div style={{
            backgroundColor: 'var(--bg-canvas)',
            padding: '1.15rem',
            borderRadius: '10px',
            border: matchedInv ? '1px solid var(--secondary-purple-border)' : '1px dashed var(--border-color)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', paddingBottom: '0.4rem', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary-purple)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Candidate Invoice Match
              </h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>System Candidate</span>
            </div>
            {matchedInv ? (
              <div style={{ fontSize: '0.84rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Invoice ID:</span>
                  <strong className="code-identifier invoice">{matchedInv.invoice_id}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Customer Name:</span>
                  <strong style={{ color: 'var(--text-main)' }}>{matchedInv.customer_name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Issue / Due Date:</span>
                  <span>{matchedInv.invoice_date} / <strong style={{ color: 'var(--warning-amber)' }}>{matchedInv.due_date}</strong></span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.4rem', borderTop: '1px dashed var(--border-color)' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Billed Amount:</span>
                  <strong style={{ color: 'var(--secondary-purple)', fontSize: '1rem' }} className="amount-cell">
                    {matchedInv.currency === 'INR' || !matchedInv.currency ? '₹' : matchedInv.currency} {matchedInv.invoice_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </strong>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', padding: '1.5rem 0', textAlign: 'center' }}>
                No candidate invoice currently paired to this transaction.
              </div>
            )}
          </div>
        </div>

        {/* AI Similarity Breakdown */}
        <div style={{
          backgroundColor: 'var(--bg-subtle)',
          padding: '1.25rem',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} color="var(--primary-blue)" />
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                AI Model Similarity Vector Breakdown
              </h3>
            </div>
            <span className="badge" style={{
              backgroundColor: transaction.confidence >= 0.85 ? 'var(--success-green-light)' : transaction.confidence >= 0.60 ? 'var(--warning-amber-light)' : 'var(--critical-red-light)',
              color: transaction.confidence >= 0.85 ? 'var(--success-green)' : transaction.confidence >= 0.60 ? 'var(--warning-amber)' : 'var(--critical-red)',
              fontSize: '0.84rem'
            }}>
              Overall Confidence: {(transaction.confidence * 100).toFixed(0)}%
            </span>
          </div>

          {fb && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <div className="feature-meter">
                <div className="feature-label">Amount Similarity</div>
                <div className="feature-track">
                  <div className="feature-fill" style={{ width: `${(fb.amount_similarity * 100).toFixed(0)}%` }} />
                </div>
                <div className="feature-score">{(fb.amount_similarity * 100).toFixed(0)}%</div>
              </div>

              <div className="feature-meter">
                <div className="feature-label">Customer Name Fuzzy Score</div>
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
                <div className="feature-label">Description Text Match</div>
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

          {/* Reasoning Checklist */}
          <div style={{ marginTop: '1rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
              Rule Engine Audit Trail
            </h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.84rem' }}>
              {transaction.reasons.map((r, i) => {
                const isNegative = r.includes('mismatch') || r.includes('Insufficient') || r.includes('Failed');
                return (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: isNegative ? 'var(--critical-red)' : 'var(--success-green)' }}>
                    {isNegative ? <AlertTriangle size={14} /> : <Check size={14} />}
                    <span>{r}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Human Review Decision Console */}
        <div style={{
          backgroundColor: 'var(--secondary-purple-light)',
          padding: '1.25rem',
          borderRadius: '10px',
          border: '1px solid var(--secondary-purple-border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserCheck size={18} color="var(--secondary-purple)" />
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--secondary-purple)' }}>
                Human Reviewer Decision Console
              </h3>
            </div>
            {transaction.human_override && (
              <span className="badge badge-exact">
                Active Override: {transaction.human_override.status}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem', alignItems: 'center' }}>
            <button
              disabled={isSubmitting}
              onClick={() => handleAction('ACCEPT')}
              className="btn-primary"
              style={{ backgroundColor: 'var(--success-green)' }}
            >
              Accept Pairing
            </button>

            <button
              disabled={isSubmitting}
              onClick={() => handleAction('REJECT')}
              className="btn-primary"
              style={{ backgroundColor: 'var(--critical-red)' }}
            >
              Reject Pairing
            </button>

            <button
              disabled={isSubmitting}
              onClick={() => handleAction('MARK_UNMATCHED')}
              className="pagination-btn"
            >
              Mark Unmatched
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto', flexWrap: 'wrap' }}>
              <select
                className="filter-select"
                value={selectedAltInvoice}
                onChange={(e) => setSelectedAltInvoice(e.target.value)}
              >
                <option value="">Reassign Custom Invoice...</option>
                {invoices.map(inv => (
                  <option key={inv.invoice_id} value={inv.invoice_id}>
                    {inv.invoice_id} - {inv.customer_name} (₹{inv.invoice_amount})
                  </option>
                ))}
              </select>
              <button
                disabled={isSubmitting || !selectedAltInvoice}
                onClick={() => handleAction('REASSIGN', selectedAltInvoice)}
                className="btn-primary"
                style={{ backgroundColor: 'var(--secondary-purple)' }}
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
