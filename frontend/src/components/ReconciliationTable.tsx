import React, { useState } from 'react';
import type { ReconciliationResult } from '../types';
import { Eye, AlertCircle, CheckCircle2, UserCheck, Search, Filter, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  results: ReconciliationResult[];
  onSelectTransaction: (txn: ReconciliationResult) => void;
  onGoToUpload?: () => void;
}

const ITEMS_PER_PAGE = 10;

export const ReconciliationTable: React.FC<Props> = ({ results, onSelectTransaction, onGoToUpload }) => {
  const [search, setSearch] = useState('');
  const [matchFilter, setMatchFilter] = useState('ALL');
  const [confidenceFilter, setConfidenceFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [reviewOnly, setReviewOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  if (results.length === 0) {
    return (
      <div className="table-card" style={{ padding: '3.5rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '14px',
          backgroundColor: 'var(--primary-blue-light)',
          color: 'var(--primary-blue)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Filter size={28} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
            No Reconciliation Pipeline Data
          </h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', fontSize: '0.875rem', margin: '0 auto' }}>
            The reconciliation engine matrix is unpopulated. Upload your Invoices CSV and Bank Transactions CSV to trigger automatic matching.
          </p>
        </div>
        {onGoToUpload && (
          <button className="btn-primary" onClick={onGoToUpload} style={{ marginTop: '0.5rem' }}>
            Upload Dataset Now
          </button>
        )}
      </div>
    );
  }

  // Filtering logic
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

  // Pagination calculations
  const totalPages = Math.ceil(filteredResults.length / ITEMS_PER_PAGE) || 1;
  const paginatedResults = filteredResults.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const resetFilters = () => {
    setSearch('');
    setMatchFilter('ALL');
    setConfidenceFilter('ALL');
    setStatusFilter('ALL');
    setReviewOnly(false);
    setCurrentPage(1);
  };

  const getMatchBadge = (type: string) => {
    switch (type) {
      case 'exact':
        return <span className="badge badge-exact">Exact Match</span>;
      case 'partial':
        return <span className="badge badge-partial">Partial Match</span>;
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
        <span className="badge badge-review" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <UserCheck size={13} /> Overridden ({res.human_override.status})
        </span>
      );
    }
    if (res.action === 'AUTO_RECONCILE') {
      return (
        <span className="badge badge-exact" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <CheckCircle2 size={13} /> Auto Reconciled
        </span>
      );
    }
    if (res.action === 'HUMAN_REVIEW') {
      return (
        <button
          onClick={(e) => { e.stopPropagation(); onSelectTransaction(res); }}
          className="badge badge-review"
          style={{ cursor: 'pointer', border: '1px solid var(--secondary-purple-border)' }}
        >
          <AlertCircle size={13} /> Review Needed
        </button>
      );
    }
    return <span className="badge badge-unpaid">Unmatched</span>;
  };

  return (
    <div className="table-card">
      {/* Filter and Search Bar Header */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search Txn ID, customer, invoice..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>

        <div className="filter-group">
          <select
            className="filter-select"
            value={matchFilter}
            onChange={(e) => { setMatchFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="ALL">All Match Types</option>
            <option value="EXACT">Exact Match</option>
            <option value="PARTIAL">Partial Match</option>
            <option value="DUPLICATE">Duplicate Payment</option>
            <option value="MISMATCH">Mismatch</option>
            <option value="UNMATCHED">Unmatched</option>
          </select>

          <select
            className="filter-select"
            value={confidenceFilter}
            onChange={(e) => { setConfidenceFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="ALL">All Confidence</option>
            <option value="HIGH">High (&gt;=85%)</option>
            <option value="MEDIUM">Medium (60-84%)</option>
            <option value="LOW">Low (&lt;60%)</option>
          </select>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="ON_TIME">On Time</option>
            <option value="LATE">Late</option>
            <option value="OVERDUE">Overdue</option>
            <option value="UNPAID">Unpaid</option>
          </select>

          <label className={`checkbox-label ${reviewOnly ? 'active' : ''}`}>
            <input
              type="checkbox"
              checked={reviewOnly}
              onChange={(e) => { setReviewOnly(e.target.checked); setCurrentPage(1); }}
            />
            <span>Needs Review</span>
          </label>

          {(search || matchFilter !== 'ALL' || confidenceFilter !== 'ALL' || statusFilter !== 'ALL' || reviewOnly) && (
            <button className="clear-btn" onClick={resetFilters} title="Reset all filters">
              <RotateCcw size={14} style={{ display: 'inline', marginRight: '4px' }} />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Clean Enterprise Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Transaction ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th>Matched Invoice</th>
              <th>Match Type</th>
              <th>AI Confidence</th>
              <th>Payment Status</th>
              <th>Action</th>
              <th style={{ textAlign: 'center' }}>Inspect</th>
            </tr>
          </thead>
          <tbody>
            {paginatedResults.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                  No transactions match the selected filter criteria.
                </td>
              </tr>
            ) : (
              paginatedResults.map((r) => (
                <tr key={r.transaction_id} onClick={() => onSelectTransaction(r)} className="interactive-row">
                  <td className="code-identifier">
                    {r.transaction_id}
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{r.transaction_date}</td>
                  <td style={{ fontWeight: 600 }}>{r.customer_name}</td>
                  <td className="amount-cell">
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginRight: '3px' }}>
                      {r.currency === 'INR' || !r.currency ? '₹' : r.currency}
                    </span>
                    {r.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    {r.invoice_id ? (
                      <span className="code-identifier invoice">
                        {r.invoice_id}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td>{getMatchBadge(r.match_type)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div className="confidence-bar-bg">
                        <div
                          className="confidence-bar-fill"
                          style={{
                            width: `${(r.confidence * 100).toFixed(0)}%`,
                            backgroundColor: r.confidence >= 0.85 ? 'var(--success-green)' : r.confidence >= 0.60 ? 'var(--warning-amber)' : 'var(--critical-red)'
                          }}
                        />
                      </div>
                      <span style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        color: r.confidence >= 0.85 ? 'var(--success-green)' : r.confidence >= 0.60 ? 'var(--warning-amber)' : 'var(--critical-red)'
                      }}>
                        {(r.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td>{getStatusBadge(r.payment_status, r.days_late)}</td>
                  <td>{getActionPill(r)}</td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectTransaction(r); }}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '6px'
                      }}
                      title="Inspect AI Breakdown"
                    >
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="table-pagination">
        <div className="pagination-text">
          Showing <strong>{filteredResults.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}</strong> to{' '}
          <strong>{Math.min(currentPage * ITEMS_PER_PAGE, filteredResults.length)}</strong> of{' '}
          <strong>{filteredResults.length}</strong> transactions
        </div>
        <div className="pagination-buttons">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={14} style={{ display: 'inline', verticalAlign: 'middle' }} /> Previous
          </button>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', padding: '0 0.5rem' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
          >
            Next <ChevronRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
          </button>
        </div>
      </div>
    </div>
  );
};
