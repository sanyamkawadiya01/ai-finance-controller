import React from 'react';
import type { EvaluationReport } from '../types';
import { Award, Target, CheckCircle2, Activity, Upload } from 'lucide-react';

interface Props {
  evaluation: EvaluationReport | null;
  onGoToUpload?: () => void;
}

export const EvaluationView: React.FC<Props> = ({ evaluation, onGoToUpload }) => {
  if (!evaluation) {
    return (
      <div className="empty-benchmark-card">
        <div className="empty-icon-box">
          <Award size={28} />
        </div>
        <div>
          <h3 className="empty-title">Ground Truth Benchmark</h3>
          <p className="empty-desc">
            Evaluate reconciliation performance against verified labels. Ground truth data has not been uploaded yet.
          </p>
        </div>
        {onGoToUpload && (
          <button className="btn-primary" onClick={onGoToUpload} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={16} />
            Upload Ground Truth Dataset
          </button>
        )}
      </div>
    );
  }

  const matchTypes = ['exact', 'partial', 'mismatch', 'unmatched', 'duplicate'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Benchmark Metric Cards */}
      <div className="summary-grid">
        {/* Overall Accuracy */}
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--success-green)' }}>
          <div className="kpi-card-header">
            <span className="kpi-title">Overall Accuracy</span>
            <div className="kpi-icon-box" style={{ backgroundColor: 'var(--success-green-light)', color: 'var(--success-green)' }}>
              <Award size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--success-green)' }}>
            {(evaluation.overall_accuracy * 100).toFixed(1)}%
          </div>
          <div className="kpi-subtext">Ground Truth Label Accuracy</div>
        </div>

        {/* Precision */}
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--primary-blue)' }}>
          <div className="kpi-card-header">
            <span className="kpi-title">Precision (Macro)</span>
            <div className="kpi-icon-box" style={{ backgroundColor: 'var(--primary-blue-light)', color: 'var(--primary-blue)' }}>
              <Target size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--primary-blue)' }}>
            {(evaluation.overall_precision * 100).toFixed(1)}%
          </div>
          <div className="kpi-subtext">Low False Positive Rate</div>
        </div>

        {/* Recall */}
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--secondary-purple)' }}>
          <div className="kpi-card-header">
            <span className="kpi-title">Recall (Macro)</span>
            <div className="kpi-icon-box" style={{ backgroundColor: 'var(--secondary-purple-light)', color: 'var(--secondary-purple)' }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--secondary-purple)' }}>
            {(evaluation.overall_recall * 100).toFixed(1)}%
          </div>
          <div className="kpi-subtext">Match Coverage Ratio</div>
        </div>

        {/* F1 Score */}
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--warning-amber)' }}>
          <div className="kpi-card-header">
            <span className="kpi-title">F1 Score (Macro)</span>
            <div className="kpi-icon-box" style={{ backgroundColor: 'var(--warning-amber-light)', color: 'var(--warning-amber)' }}>
              <Activity size={16} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: 'var(--warning-amber)' }}>
            {(evaluation.overall_f1 * 100).toFixed(1)}%
          </div>
          <div className="kpi-subtext">Harmonic Mean Metrics</div>
        </div>
      </div>

      {/* Category Performance & Confusion Matrix Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Category Performance Table */}
        <div className="white-card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>
            Per-Category Performance
          </h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Accuracy</th>
                  <th>Precision</th>
                  <th>Recall</th>
                  <th>F1 Score</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(evaluation.category_metrics).map(([cat, m]) => (
                  <tr key={cat}>
                    <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>{cat}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{(m.accuracy * 100).toFixed(0)}%</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{(m.precision * 100).toFixed(0)}%</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{(m.recall * 100).toFixed(0)}%</td>
                    <td style={{ fontWeight: 700, color: 'var(--success-green)', fontFamily: 'var(--font-mono)' }}>{(m.f1_score * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Confusion Matrix Table */}
        <div className="white-card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>
            Confusion Matrix (Ground Truth vs Predicted)
          </h3>
          <div className="table-container">
            <table className="data-table" style={{ fontSize: '0.8125rem' }}>
              <thead>
                <tr>
                  <th>GT \ Pred</th>
                  {matchTypes.map(m => (
                    <th key={m} style={{ textAlign: 'center', textTransform: 'capitalize' }}>{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matchTypes.map(gtType => (
                  <tr key={gtType}>
                    <td style={{ fontWeight: 600, textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{gtType}</td>
                    {matchTypes.map(predType => {
                      const count = evaluation.confusion_matrix[gtType]?.[predType] || 0;
                      const isDiagonal = (gtType === predType);
                      return (
                        <td
                          key={predType}
                          style={{
                            textAlign: 'center',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: count > 0 ? 700 : 400,
                            backgroundColor: isDiagonal && count > 0 ? 'var(--success-green-light)' : count > 0 ? 'var(--critical-red-light)' : 'transparent',
                            color: isDiagonal && count > 0 ? 'var(--success-green)' : count > 0 ? 'var(--critical-red)' : 'var(--text-muted)'
                          }}
                        >
                          {count}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Predictions vs Ground Truth Detailed Audit Matrix */}
      <div className="white-card">
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>
          Predictions vs Ground Truth Detailed Audit
        </h3>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Txn ID</th>
                <th>Predicted Inv</th>
                <th>Ground Truth Inv</th>
                <th>Pred Match</th>
                <th>GT Match</th>
                <th>Pred Status</th>
                <th>GT Status</th>
                <th style={{ textAlign: 'center' }}>Audit</th>
              </tr>
            </thead>
            <tbody>
              {evaluation.predictions_vs_ground_truth.map(item => (
                <tr key={item.transaction_id}>
                  <td className="code-identifier">{item.transaction_id}</td>
                  <td className="code-identifier invoice">{item.predicted_invoice_id || '—'}</td>
                  <td className="code-identifier" style={{ color: 'var(--text-secondary)' }}>{item.ground_truth_invoice_id || '—'}</td>
                  <td style={{ textTransform: 'capitalize' }}>{item.predicted_match_type}</td>
                  <td style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{item.ground_truth_match_type}</td>
                  <td style={{ textTransform: 'capitalize' }}>{item.predicted_payment_status}</td>
                  <td style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>{item.ground_truth_payment_status}</td>
                  <td style={{ textAlign: 'center' }}>
                    {item.is_match_correct ? (
                      <span className="badge badge-exact">✓ Correct</span>
                    ) : (
                      <span className="badge badge-unmatched">✗ Mismatch</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
