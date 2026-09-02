import React from 'react';
import type { DashboardSummary } from '../types';
import { FileText, CreditCard, CheckCircle2, UserCheck, AlertTriangle, Clock, XCircle } from 'lucide-react';

interface Props {
  summary: DashboardSummary | null;
}

export const DashboardSummaryView: React.FC<Props> = ({ summary }) => {
  if (!summary) return null;

  return (
    <div>
      <div className="summary-grid">
        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span>Total Invoices</span>
            <FileText size={18} className="text-cyan-400" />
          </div>
          <div className="stat-value">{summary.total_invoices}</div>
          <div className="stat-subtext">${summary.total_amount_invoiced.toLocaleString()} invoiced</div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span>Bank Transactions</span>
            <CreditCard size={18} className="text-indigo-400" />
          </div>
          <div className="stat-value">{summary.total_transactions}</div>
          <div className="stat-subtext">${summary.total_amount_received.toLocaleString()} received</div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span>Matched Payments</span>
            <CheckCircle2 size={18} style={{ color: '#10b981' }} />
          </div>
          <div className="stat-value" style={{ color: '#34d399' }}>{summary.matched_count}</div>
          <div className="stat-subtext">
            {((summary.matched_count / summary.total_transactions) * 100).toFixed(0)}% match rate
          </div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span>Needs Human Review</span>
            <UserCheck size={18} style={{ color: '#a855f7' }} />
          </div>
          <div className="stat-value" style={{ color: '#c084fc' }}>{summary.human_review_count}</div>
          <div className="stat-subtext">Medium confidence / Overrides</div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span>Unmatched / Mismatch</span>
            <XCircle size={18} style={{ color: '#f43f5e' }} />
          </div>
          <div className="stat-value" style={{ color: '#fb7185' }}>{summary.unmatched_count}</div>
          <div className="stat-subtext">Requires investigation</div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span>Duplicate Payments</span>
            <AlertTriangle size={18} style={{ color: '#f59e0b' }} />
          </div>
          <div className="stat-value" style={{ color: '#fbbf24' }}>{summary.duplicate_count}</div>
          <div className="stat-subtext">Flagged cross-transaction</div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span>Late Payments</span>
            <Clock size={18} style={{ color: '#f59e0b' }} />
          </div>
          <div className="stat-value" style={{ color: '#fbbf24' }}>{summary.late_payments_count}</div>
          <div className="stat-subtext">Paid after due date</div>
        </div>

        <div className="glass-panel stat-card">
          <div className="stat-header">
            <span>Overdue Invoices</span>
            <AlertTriangle size={18} style={{ color: '#f43f5e' }} />
          </div>
          <div className="stat-value" style={{ color: '#f43f5e' }}>{summary.overdue_invoices_count}</div>
          <div className="stat-subtext">Unpaid past due date</div>
        </div>
      </div>
    </div>
  );
};
