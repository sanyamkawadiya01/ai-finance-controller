import React from 'react';
import type { EvaluationReport } from '../types';
import { Award, Target, CheckCircle2 } from 'lucide-react';

interface Props {
  evaluation: EvaluationReport | null;
}

export const EvaluationView: React.FC<Props> = ({ evaluation }) => {
  if (!evaluation) return null;

  const matchTypes = ['exact', 'partial', 'mismatch', 'unmatched', 'duplicate'];

  return (
    <div>
      {/* Metric Cards */}
      <div className="summary-grid" style={{ marginBottom: '2rem' }}>
        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="stat-header">
            <span>Overall Accuracy</span>
            <Award size={18} style={{ color: '#10b981' }} />
          </div>
          <div className="stat-value" style={{ color: '#34d399' }}>
            {(evaluation.overall_accuracy * 100).toFixed(1)}%
          </div>
          <div className="stat-subtext">Ground truth matching accuracy</div>
        </div>

        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #38bdf8' }}>
          <div className="stat-header">
            <span>Precision (Macro)</span>
            <Target size={18} style={{ color: '#38bdf8' }} />
          </div>
          <div className="stat-value" style={{ color: '#38bdf8' }}>
            {(evaluation.overall_precision * 100).toFixed(1)}%
          </div>
          <div className="stat-subtext">Low false positive rate</div>
        </div>

        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #818cf8' }}>
          <div className="stat-header">
            <span>Recall (Macro)</span>
            <CheckCircle2 size={18} style={{ color: '#818cf8' }} />
          </div>
          <div className="stat-value" style={{ color: '#818cf8' }}>
            {(evaluation.overall_recall * 100).toFixed(1)}%
          </div>
          <div className="stat-subtext">Match coverage score</div>
        </div>

        <div className="glass-panel stat-card" style={{ borderLeft: '4px solid #c084fc' }}>
          <div className="stat-header">
            <span>F1 Score (Macro)</span>
            <Award size={18} style={{ color: '#c084fc' }} />
          </div>
          <div className="stat-value" style={{ color: '#c084fc' }}>
            {(evaluation.overall_f1 * 100).toFixed(1)}%
          </div>
          <div className="stat-subtext">Harmonic mean of precision & recall</div>
        </div>
      </div>

      {/* Category Breakdown & Confusion Matrix */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Per Category Performance */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '1rem' }}>
            Per-Category Evaluation Metrics
          </h3>
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
                  <td style={{ fontWeight: 600, textTransform: 'capitalize', color: '#38bdf8' }}>{cat}</td>
                  <td>{(m.accuracy * 100).toFixed(0)}%</td>
                  <td>{(m.precision * 100).toFixed(0)}%</td>
                  <td>{(m.recall * 100).toFixed(0)}%</td>
                  <td style={{ fontWeight: 600, color: '#34d399' }}>{(m.f1_score * 100).toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Confusion Matrix Table */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '1rem' }}>
            Confusion Matrix (Ground Truth vs Predicted)
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ fontSize: '0.8125rem' }}>
              <thead>
                <tr>
                  <th>Ground Truth \ Pred</th>
                  {matchTypes.map(m => (
                    <th key={m} style={{ textAlign: 'center' }}>{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matchTypes.map(gtType => (
                  <tr key={gtType}>
                    <td style={{ fontWeight: 600, textTransform: 'capitalize', color: '#94a3b8' }}>{gtType}</td>
                    {matchTypes.map(predType => {
                      const count = evaluation.confusion_matrix[gtType]?.[predType] || 0;
                      const isDiagonal = (gtType === predType);
                      return (
                        <td
                          key={predType}
                          style={{
                            textAlign: 'center',
                            fontWeight: count > 0 ? 700 : 400,
                            background: isDiagonal && count > 0 ? 'rgba(16, 185, 129, 0.2)' : count > 0 ? 'rgba(244, 63, 94, 0.2)' : 'transparent',
                            color: isDiagonal && count > 0 ? '#34d399' : count > 0 ? '#f43f5e' : '#64748b'
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

      {/* Predictions vs Ground Truth Audit Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '1rem' }}>
          Detailed Predictions vs Ground Truth Audit
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
                <th>Match Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {evaluation.predictions_vs_ground_truth.map(item => (
                <tr key={item.transaction_id}>
                  <td style={{ fontWeight: 600, color: '#38bdf8' }}>{item.transaction_id}</td>
                  <td>{item.predicted_invoice_id || '—'}</td>
                  <td style={{ color: '#94a3b8' }}>{item.ground_truth_invoice_id || '—'}</td>
                  <td style={{ textTransform: 'capitalize' }}>{item.predicted_match_type}</td>
                  <td style={{ textTransform: 'capitalize', color: '#94a3b8' }}>{item.ground_truth_match_type}</td>
                  <td style={{ textTransform: 'capitalize' }}>{item.predicted_payment_status}</td>
                  <td style={{ textTransform: 'capitalize', color: '#94a3b8' }}>{item.ground_truth_payment_status}</td>
                  <td>
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
