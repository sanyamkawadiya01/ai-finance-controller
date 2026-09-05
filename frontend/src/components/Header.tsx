import React from 'react';
import type { DatasetStatus } from '../types';
import { RefreshCw, Bell, Database, Check } from 'lucide-react';
import { ReportExportMenu } from './ReportExportMenu';

interface HeaderProps {
  activeTab: 'dashboard' | 'upload' | 'evaluation' | 'data';
  datasetStatus: DatasetStatus | null;
  isReconciling: boolean;
  onTriggerReconciliation: () => Promise<void>;
  onNotification: (message: string, type: 'success' | 'error') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  datasetStatus,
  isReconciling,
  onTriggerReconciliation,
  onNotification
}) => {
  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'Reconciliation Matrix',
          subtitle: 'AI-powered invoice to bank transaction reconciliation'
        };
      case 'upload':
        return {
          title: 'Upload Dataset',
          subtitle: 'Import CSV source files for invoices, bank transactions, and ground truth'
        };
      case 'evaluation':
        return {
          title: 'Ground Truth Benchmark',
          subtitle: 'Evaluate AI model accuracy, precision, recall, and confusion matrix against verified labels'
        };
      case 'data':
        return {
          title: 'Raw Dataset Inspector',
          subtitle: 'Inspect raw source records for invoices and bank transactions'
        };
    }
  };

  const { title, subtitle } = getTabTitle();

  const invoicesCount = datasetStatus ? datasetStatus.invoices_count : 0;
  const txnsCount = datasetStatus ? datasetStatus.transactions_count : 0;
  const datasetLabel = datasetStatus?.source === 'uploaded' ? 'Custom Dataset' : (datasetStatus?.source === 'default' ? 'Sample Dataset' : 'No Dataset');

  return (
    <header className="app-header">
      <div className="header-titles">
        <h1 className="header-title-text">{title}</h1>
        <p className="header-subtitle-text">{subtitle}</p>
      </div>

      <div className="header-actions">
        {/* Dataset Selector / Indicator Pill */}
        <div className="dataset-selector-pill">
          <div className="dataset-selector-icon">
            <Database size={15} color="#2563EB" />
          </div>
          <div className="dataset-selector-content">
            <span className="dataset-name">{datasetLabel}</span>
            <span className="dataset-counts">{invoicesCount} Invoices • {txnsCount} Transactions</span>
          </div>
          <Check size={14} color="#16A34A" style={{ marginLeft: '4px' }} />
        </div>

        {/* Notification Icon */}
        <button className="header-icon-btn" title="System Notifications">
          <Bell size={18} />
          <span className="notification-dot" />
        </button>

        {/* Generate Report Export Dropdown Button */}
        <ReportExportMenu
          onNotification={onNotification}
          disabled={isReconciling}
        />

        {/* Run Reconciliation Primary Button */}
        <button
          className="run-reconciliation-btn"
          onClick={onTriggerReconciliation}
          disabled={isReconciling}
        >
          <RefreshCw size={16} className={isReconciling ? 'animate-spin' : ''} />
          <span>{isReconciling ? 'Reconciling...' : 'Run Reconciliation'}</span>
        </button>
      </div>
    </header>
  );
};

