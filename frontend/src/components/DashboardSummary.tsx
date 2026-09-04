import React from 'react';
import type { DashboardSummary } from '../types';
import {
  FileText,
  CreditCard,
  CheckCircle2,
  UserCheck,
  XCircle,
  Copy,
  Clock,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

interface Props {
  summary: DashboardSummary | null;
}

export const DashboardSummaryView: React.FC<Props> = ({ summary }) => {
  if (!summary) return null;

  const matchRate = summary.total_transactions > 0
    ? ((summary.matched_count / summary.total_transactions) * 100).toFixed(1)
    : '0.0';

  // Currency helper: format millions if large, else formatted number
  const formatCurrency = (val: number) => {
    if (val >= 1000000) {
      return `₹${(val / 1000000).toFixed(2)}M`;
    }
    return `₹${val.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  };

  // Donut SVG Math calculations
  const totalTxns = summary.total_transactions || 1;
  const matchedRatio = summary.matched_count / totalTxns;
  const reviewRatio = summary.human_review_count / totalTxns;
  const unmatchedRatio = summary.unmatched_count / totalTxns;
  const duplicateRatio = summary.duplicate_count / totalTxns;

  const radius = 50;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  // Segment stroke dash offsets
  const seg1Offset = 0;
  const seg1Dash = matchedRatio * circumference;

  const seg2Offset = -seg1Dash;
  const seg2Dash = reviewRatio * circumference;

  const seg3Offset = -(seg1Dash + seg2Dash);
  const seg3Dash = unmatchedRatio * circumference;

  const seg4Offset = -(seg1Dash + seg2Dash + seg3Dash);
  const seg4Dash = duplicateRatio * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 8 Neutral KPI Cards Grid */}
      <div className="summary-grid">
        {/* Card 1: Total Invoices */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Total Invoices</span>
            <div className="kpi-icon-box" style={{ backgroundColor: 'var(--primary-blue-light)', color: 'var(--primary-blue)' }}>
              <FileText size={16} />
            </div>
          </div>
          <div className="kpi-value">{summary.total_invoices.toLocaleString()}</div>
          <div className="kpi-subtext">
            <strong>{formatCurrency(summary.total_amount_invoiced)}</strong> Total Billed
          </div>
        </div>

        {/* Card 2: Bank Transactions */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Bank Transactions</span>
            <div className="kpi-icon-box" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-main)' }}>
              <CreditCard size={16} />
            </div>
          </div>
          <div className="kpi-value">{summary.total_transactions.toLocaleString()}</div>
          <div className="kpi-subtext">
            <strong>{formatCurrency(summary.total_amount_received)}</strong> Total Received
          </div>
        </div>

        {/* Card 3: Auto Matched */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Auto Matched</span>
            <div className="kpi-icon-box" style={{ backgroundColor: 'var(--success-green-light)', color: 'var(--success-green)' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--success-green)' }}>{summary.matched_count}</div>
          <div className="kpi-subtext">
            <span className="kpi-badge" style={{ backgroundColor: 'var(--success-green-light)', color: 'var(--success-green)' }}>
              {matchRate}% Match Rate
            </span>
          </div>
        </div>

        {/* Card 4: Needs Review */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Needs Review</span>
            <div className="kpi-icon-box" style={{ backgroundColor: 'var(--secondary-purple-light)', color: 'var(--secondary-purple)' }}>
              <UserCheck size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--secondary-purple)' }}>{summary.human_review_count}</div>
          <div className="kpi-subtext" style={{ color: 'var(--secondary-purple)' }}>
            Requires Attention
          </div>
        </div>

        {/* Card 5: Unmatched */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Unmatched</span>
            <div className="kpi-icon-box" style={{ backgroundColor: 'var(--critical-red-light)', color: 'var(--critical-red)' }}>
              <XCircle size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--critical-red)' }}>{summary.unmatched_count}</div>
          <div className="kpi-subtext" style={{ color: 'var(--critical-red)' }}>
            Requires Investigation
          </div>
        </div>

        {/* Card 6: Duplicates */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Duplicates</span>
            <div className="kpi-icon-box" style={{ backgroundColor: 'var(--warning-amber-light)', color: 'var(--warning-amber)' }}>
              <Copy size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--warning-amber)' }}>{summary.duplicate_count}</div>
          <div className="kpi-subtext" style={{ color: 'var(--warning-amber)' }}>
            Potential Duplicates
          </div>
        </div>

        {/* Card 7: Late Payments */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Late Payments</span>
            <div className="kpi-icon-box" style={{ backgroundColor: 'var(--warning-amber-light)', color: 'var(--warning-amber)' }}>
              <Clock size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--warning-amber)' }}>{summary.late_payments_count}</div>
          <div className="kpi-subtext">
            Received Post Due Date
          </div>
        </div>

        {/* Card 8: Overdue Invoices */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-title">Overdue Invoices</span>
            <div className="kpi-icon-box" style={{ backgroundColor: 'var(--critical-red-light)', color: 'var(--critical-red)' }}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--critical-red)' }}>{summary.overdue_invoices_count}</div>
          <div className="kpi-subtext" style={{ color: 'var(--critical-red)' }}>
            Unpaid Past Due Date
          </div>
        </div>
      </div>

      {/* Reconciliation Overview Analytics Card */}
      <div className="analytics-overview-card">
        <div className="analytics-card-title">Reconciliation Overview</div>
        
        <div className="donut-flex-container">
          {/* SVG Donut Chart */}
          <div className="donut-chart-wrapper">
            <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background circle */}
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                stroke="var(--bg-subtle)"
                strokeWidth={strokeWidth}
              />
              {/* Segment 1: Auto Matched (Green #16A34A) */}
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                stroke="#16A34A"
                strokeWidth={strokeWidth}
                strokeDasharray={`${seg1Dash} ${circumference - seg1Dash}`}
                strokeDashoffset={seg1Offset}
              />
              {/* Segment 2: Needs Review (Purple #7C3AED) */}
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                stroke="#7C3AED"
                strokeWidth={strokeWidth}
                strokeDasharray={`${seg2Dash} ${circumference - seg2Dash}`}
                strokeDashoffset={seg2Offset}
              />
              {/* Segment 3: Unmatched (Red #DC2626) */}
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                stroke="#DC2626"
                strokeWidth={strokeWidth}
                strokeDasharray={`${seg3Dash} ${circumference - seg3Dash}`}
                strokeDashoffset={seg3Offset}
              />
              {/* Segment 4: Duplicates (Amber #D97706) */}
              <circle
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                stroke="#D97706"
                strokeWidth={strokeWidth}
                strokeDasharray={`${seg4Dash} ${circumference - seg4Dash}`}
                strokeDashoffset={seg4Offset}
              />
            </svg>

            <div className="donut-center-label">
              <div className="donut-center-value">{matchRate}%</div>
              <div className="donut-center-sub">Matched</div>
            </div>
          </div>

          {/* Donut Legend */}
          <div className="legend-grid">
            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: '#16A34A' }} />
              <div className="legend-info">
                <span className="legend-label">Auto Matched</span>
                <span className="legend-count">{summary.matched_count}</span>
              </div>
            </div>

            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: '#7C3AED' }} />
              <div className="legend-info">
                <span className="legend-label">Needs Review</span>
                <span className="legend-count">{summary.human_review_count}</span>
              </div>
            </div>

            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: '#DC2626' }} />
              <div className="legend-info">
                <span className="legend-label">Unmatched</span>
                <span className="legend-count">{summary.unmatched_count}</span>
              </div>
            </div>

            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: '#D97706' }} />
              <div className="legend-info">
                <span className="legend-label">Duplicates</span>
                <span className="legend-count">{summary.duplicate_count}</span>
              </div>
            </div>
          </div>

          {/* Match Rate Callout */}
          <div className="match-rate-callout">
            <span className="match-rate-title">Match Rate</span>
            <span className="match-rate-number">{matchRate}%</span>
            <div className="match-rate-trend">
              <TrendingUp size={14} />
              <span>↑ 4.2% vs last run</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
