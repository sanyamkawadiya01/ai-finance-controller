import React, { useState } from 'react';
import type { ReconciliationResult } from '../types';
import { Eye, AlertCircle, CheckCircle, UserCheck, Upload } from 'lucide-react';

interface Props {
  results: ReconciliationResult[];
  onSelectTransaction: (txn: ReconciliationResult) => void;
  onGoToUpload?: () => void;
}

export const ReconciliationTable: React.FC<Props> = ({ results, onSelectTransaction, onGoToUpload }) => {
  const [search, setSearch] = useState('');
  const [matchFilter, setMatchFilter] = useState('ALL');
  const [confidenceFilter, setConfidenceFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [reviewOnly, setReviewOnly] = useState(false);

  if (results.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '3.5rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
          <Upload size={32} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
            No Reconciliation Data Available
          </h3>
          <p style={{ color: '#94a3b8', maxWidth: '520px', fontSize: '0.875rem', lineHeight: '1.5', margin: '0 auto' }}>
            The reconciliation table is currently empty. Please upload your <strong>Invoices CSV</strong> and <strong>Bank Transactions CSV</strong> files to run the engine and view results.
          </p>
        </div>
        {onGoToUpload && (
          <button className="action-btn" onClick={onGoToUpload} style={{ marginTop: '0.5rem' }}>
            <Upload size={16} />
            Upload Dataset Now
          </button>
        )}
      </div>
    );
  }

  const filteredResults = results.filter(r => {
    const query = search.toLowerCase();
    const matchesSearch =
      r.transaction_id.toLowerCase().includes(query) ||
      r.customer_name.toLowerCase().includes(query) ||
      (r.invoice_id && r.invoice_id.toLowerCase().includes(query));

    if (!matchesSearch) return false;
    if (matchFilter !== 'ALL' && r.match_type !== matchFilter.toLowerCase()) return false;
    if (confidenceFilter !== 'ALL' && r.confidence_level !== confidenceFilter) return false;
    if (statusFilter !== 'ALL' && r.payment_status !== statusFilter.toLowerCase()) return false;
    if (reviewOnly && r.action !== 'HUMAN_REVIEW') return false;

    return true;
  });

  const getMatchBadge = (type: string) => {
    switch (type) {
      case 'exact':
        return <span className="badge badge-exact">Exact</span>;
      case 'partial':
        return <span className="badge badge-partial">Partial</span>;
      case 'duplicate':
        return <span className="badge badge-duplicate">Duplicate</span>;
      case 'mismatch':
        return <span className="badge badge-mismatch">Mismatch</span>;
      case 'unmatched':
      default:
        return <span className="badge badge-unmatched">Unmatched</span>;
    }
  };

  const getStatusBadge = (status: string, daysLate: number) => {
    switch (status) {
      case 'on_time':
        return <span className="badge badge-on_time">On Time</span>;
      case 'late':
        return <span className="badge badge-late">Late ({daysLate}d)</span>;
      case 'overdue':
        return <span className="badge badge-overdue">Overdue</span>;
      case 'unpaid':
      default:
        return <span className="badge badge-unpaid">Unpaid</span>;
    }
  };

  const getActionPill = (res: ReconciliationResult) => {
    if (res.human_override) {
      return (
        <span style={{ color: '#c084fc', fontWeight: 600, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <UserCheck size={14} /> Overridden ({res.human_override.status})
        </span>
      );
    }
    if (res.action === 'AUTO_RECONCILE') {
      return (
        <span style={{ color: '#34d399', fontWeight: 600, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <CheckCircle size={14} /> Auto Reconciled
        </span>
      );
    }
    if (res.action === 'HUMAN_REVIEW') {
      return (
        <button
          onClick={(e) => { e.stopPropagation(); onSelectTransaction(res); }}
          style={{
            background: 'rgba(168, 85, 247, 0.2)',
            border: '1px solid rgba(168, 85, 247, 0.4)',
            color: '#c084fc',
            padding: '0.25rem 0.625rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <AlertCircle size={13} /> Review Needed
        </button>
      );
    }
    return <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Unmatched</span>;
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <div className="filter-bar">
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <input
            type="text"
            className="search-input"
            placeholder="Search ID, customer, invoice..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select className="select-filter" value={matchFilter} onChange={(e) => setMatchFilter(e.target.value)}>
          <option value="ALL">All Match Types</option>
          <option value="EXACT">Exact Match</option>
          <option value="PARTIAL">Partial Match</option>
          <option value="DUPLICATE">Duplicate Payment</option>
          <option value="MISMATCH">Mismatch</option>
          <option value="UNMATCHED">Unmatched</option>
        </select>

        <select className="select-filter" value={confidenceFilter} onChange={(e) => setConfidenceFilter(e.target.value)}>
          <option value="ALL">All Confidence Levels</option>
          <option value="HIGH">High Confidence (&gt;=85%)</option>
          <option value="MEDIUM">Medium Confidence (60-84%)</option>
          <option value="LOW">Low Confidence (&lt;60%)</option>
        </select>

        <select className="select-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="ALL">All Payment Statuses</option>
          <option value="ON_TIME">On Time</option>
          <option value="LATE">Late</option>
          <option value="OVERDUE">Overdue</option>
          <option value="UNPAID">Unpaid</option>
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer', marginLeft: 'auto' }}>
          <input
            type="checkbox"
            checked={reviewOnly}
            onChange={(e) => setReviewOnly(e.target.checked)}
          />
          <span style={{ color: '#c084fc', fontWeight: 600 }}>Needs Human Review</span>
        </label>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Txn ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Matched Invoice</th>
              <th>Match Type</th>
              <th>Confidence</th>
              <th>Payment Status</th>
              <th>Action</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  No transactions match the selected filters.
                </td>
              </tr>
            ) : (
              filteredResults.map((r) => (
                <tr key={r.transaction_id} onClick={() => onSelectTransaction(r)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 600, color: '#38bdf8' }}>{r.transaction_id}</td>
                  <td>{r.transaction_date}</td>
                  <td>{r.customer_name}</td>
                  <td style={{ fontWeight: 600 }}>
                    {r.currency} {r.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    {r.invoice_id ? (
                      <span style={{ color: '#818cf8', fontWeight: 600 }}>{r.invoice_id}</span>
                    ) : (
                      <span style={{ color: '#64748b' }}>—</span>
                    )}
                  </td>
                  <td>{getMatchBadge(r.match_type)}</td>
                  <td>
                    <div>
                      <div className="confidence-bar-bg">
                        <div
                          className="confidence-bar-fill"
                          style={{
                            width: `${(r.confidence * 100).toFixed(0)}%`,
                            backgroundColor: r.confidence >= 0.85 ? '#10b981' : r.confidence >= 0.60 ? '#f59e0b' : '#f43f5e'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {(r.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td>{getStatusBadge(r.payment_status, r.days_late)}</td>
                  <td>{getActionPill(r)}</td>
                  <td>
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectTransaction(r); }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '4px'
                      }}
                      title="Inspect Transaction"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
