import React from 'react';
import {
  LayoutDashboard,
  Upload,
  Award,
  Database,
  ShieldCheck,
  User,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeTab: 'dashboard' | 'upload' | 'evaluation' | 'data';
  setActiveTab: (tab: 'dashboard' | 'upload' | 'evaluation' | 'data') => void;
  resultsCount: number;
  hasGroundTruth: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  resultsCount,
  hasGroundTruth
}) => {
  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo-icon">
          <ShieldCheck size={22} color="#FFFFFF" />
        </div>
        <div className="brand-text-container">
          <div className="brand-title-text">
            AI Finance Controller
          </div>
          <div className="brand-subtitle-badge">
            FINTECH RECONCILIATION
          </div>
        </div>
      </div>

      {/* Main Navigation Section */}
      <div className="sidebar-nav-section">
        <div className="sidebar-section-title">CORE MODULES</div>
        
        <button
          className={`sidebar-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <div className="nav-item-icon">
            <LayoutDashboard size={18} />
          </div>
          <span className="nav-item-label">Reconciliation Matrix</span>
          {resultsCount > 0 && (
            <span className="nav-badge count-badge">{resultsCount}</span>
          )}
        </button>

        <button
          className={`sidebar-nav-item ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <div className="nav-item-icon">
            <Upload size={18} />
          </div>
          <span className="nav-item-label">Upload Dataset</span>
        </button>

        <button
          className={`sidebar-nav-item ${activeTab === 'evaluation' ? 'active' : ''}`}
          onClick={() => setActiveTab('evaluation')}
        >
          <div className="nav-item-icon">
            <Award size={18} />
          </div>
          <span className="nav-item-label">Ground Truth Benchmark</span>
          <span className={`nav-badge ${hasGroundTruth ? 'status-badge-ready' : 'status-badge-pending'}`}>
            {hasGroundTruth ? 'Ready' : 'Optional'}
          </span>
        </button>

        <button
          className={`sidebar-nav-item ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => setActiveTab('data')}
        >
          <div className="nav-item-icon">
            <Database size={18} />
          </div>
          <span className="nav-item-label">Raw Dataset Inspector</span>
        </button>
      </div>

      {/* User Profile Footer */}
      <div className="sidebar-user-footer">
        <div className="user-avatar">
          <User size={18} color="#2563EB" />
        </div>
        <div className="user-info">
          <div className="user-name">Sanyam Kawadiya</div>
          <div className="user-role">Finance Controller</div>
        </div>
        <ChevronRight size={16} className="user-chevron" />
      </div>
    </aside>
  );
};

