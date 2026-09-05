import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet, ChevronDown, Loader2 } from 'lucide-react';

interface ReportExportMenuProps {
  onNotification: (message: string, type: 'success' | 'error') => void;
  disabled?: boolean;
}

const API_BASE = 'http://localhost:8000/api';

export const ReportExportMenu: React.FC<ReportExportMenuProps> = ({
  onNotification,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingType, setLoadingType] = useState<'pdf' | 'excel' | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGenerateReport = async (format: 'pdf' | 'excel') => {
    setIsOpen(false);
    setLoadingType(format);

    const endpoint = `${API_BASE}/reports/${format}`;
    const dateStr = new Date().toISOString().split('T')[0];
    const defaultFilename = `AI_Finance_Controller_Report_${dateStr}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Accept': format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });

      if (!response.ok) {
        let errorText = `Failed to generate ${format.toUpperCase()} report (${response.status})`;
        try {
          const errJson = await response.json();
          if (errJson.detail) errorText = errJson.detail;
        } catch {
          // Fallback to generic text
        }
        throw new Error(errorText);
      }

      // Parse filename from Content-Disposition header if available
      let filename = defaultFilename;
      const disposition = response.headers.get('Content-Disposition');
      if (disposition && disposition.includes('filename=')) {
        const match = disposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      onNotification(
        `${format.toUpperCase()} Report "${filename}" generated and downloaded successfully!`,
        'success'
      );
    } catch (err: any) {
      console.error(`Error generating ${format} report:`, err);
      onNotification(
        err.message || `An unexpected error occurred while generating the ${format.toUpperCase()} report.`,
        'error'
      );
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className="report-export-container" ref={menuRef} style={{ position: 'relative' }}>
      <button
        className="generate-report-btn"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || loadingType !== null}
        title="Generate & Export Reconciliation Reports"
      >
        {loadingType !== null ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Download size={16} />
        )}
        <span>
          {loadingType === 'pdf'
            ? 'Generating PDF...'
            : loadingType === 'excel'
            ? 'Generating Excel...'
            : 'Generate Report'}
        </span>
        <ChevronDown size={14} style={{ marginLeft: '2px', opacity: 0.8 }} />
      </button>

      {isOpen && (
        <div className="report-dropdown-menu">
          <div className="dropdown-menu-header">
            Export Reconciliation Report
          </div>

          <button
            className="dropdown-menu-item"
            onClick={() => handleGenerateReport('pdf')}
          >
            <div className="dropdown-item-icon pdf-icon">
              <FileText size={18} />
            </div>
            <div className="dropdown-item-content">
              <span className="item-title">Generate PDF Report</span>
              <span className="item-desc">Executive summary, KPIs, reconciliation matrix & exceptions</span>
            </div>
          </button>

          <button
            className="dropdown-menu-item"
            onClick={() => handleGenerateReport('excel')}
          >
            <div className="dropdown-item-icon excel-icon">
              <FileSpreadsheet size={18} />
            </div>
            <div className="dropdown-item-content">
              <span className="item-title">Generate Excel Report</span>
              <span className="item-desc">Multi-sheet workbook (.xlsx) with raw data, filters & KPIs</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
