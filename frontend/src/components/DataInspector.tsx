import React, { useState } from 'react';
import type { Invoice, BankTransaction } from '../types';
import { FileText, CreditCard, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  invoices: Invoice[];
  transactions: BankTransaction[];
}

const ITEMS_PER_PAGE = 10;

export const DataInspector: React.FC<Props> = ({ invoices, transactions }) => {
  const [subTab, setSubTab] = useState<'invoices' | 'transactions'>('invoices');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const isInv = subTab === 'invoices';

  // Filter logic
  const filteredInvoices = invoices.filter(inv => {
    const q = search.toLowerCase();
    return (
      inv.invoice_id.toLowerCase().includes(q) ||
      inv.customer_name.toLowerCase().includes(q) ||
      inv.customer_id.toLowerCase().includes(q)
    );
  });

  const filteredTransactions = transactions.filter(txn => {
    const q = search.toLowerCase();
    return (
      txn.transaction_id.toLowerCase().includes(q) ||
      txn.customer_name.toLowerCase().includes(q) ||
      txn.description.toLowerCase().includes(q) ||
      (txn.reference && txn.reference.toLowerCase().includes(q))
    );
  });

  const activeDataset = isInv ? filteredInvoices : filteredTransactions;
  const totalPages = Math.ceil(activeDataset.length / ITEMS_PER_PAGE) || 1;
  const paginatedData = activeDataset.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="table-card">
      {/* Header & Sub-Tab Bar */}
      <div className="filter-bar" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => { setSubTab('invoices'); setSearch(''); setCurrentPage(1); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.55rem 1rem',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: subTab === 'invoices' ? 'var(--primary-blue-border)' : 'var(--border-color)',
              backgroundColor: subTab === 'invoices' ? 'var(--primary-blue-light)' : '#FFFFFF',
              color: subTab === 'invoices' ? 'var(--primary-blue)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer'
            }}
          >
            <FileText size={16} /> Invoices ({invoices.length})
          </button>

          <button
            onClick={() => { setSubTab('transactions'); setSearch(''); setCurrentPage(1); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.55rem 1rem',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: subTab === 'transactions' ? 'var(--secondary-purple-border)' : 'var(--border-color)',
              backgroundColor: subTab === 'transactions' ? 'var(--secondary-purple-light)' : '#FFFFFF',
              color: subTab === 'transactions' ? 'var(--secondary-purple)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer'
            }}
          >
            <CreditCard size={16} /> Bank Transactions ({transactions.length})
          </button>
        </div>

        <div className="search-input-wrapper" style={{ maxWidth: '300px' }}>
          <Search size={15} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder={isInv ? "Search invoice ID, customer..." : "Search Txn ID, customer, desc..."}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="table-container">
        {isInv ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Customer ID</th>
                <th>Customer Name</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th>Currency</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    No invoices match your search.
                  </td>
                </tr>
              ) : (
                (paginatedData as Invoice[]).map(inv => (
                  <tr key={inv.invoice_id}>
                    <td className="code-identifier invoice">{inv.invoice_id}</td>
                    <td className="code-identifier" style={{ color: 'var(--text-secondary)' }}>{inv.customer_id}</td>
                    <td style={{ fontWeight: 600 }}>{inv.customer_name}</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{inv.invoice_date}</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--warning-amber)', fontWeight: 500 }}>{inv.due_date}</td>
                    <td className="amount-cell">
                      {inv.invoice_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{inv.currency}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Txn ID</th>
                <th>Date</th>
                <th>Description</th>
                <th>Customer Name</th>
                <th>Reference</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th>Currency</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    No bank transactions match your search.
                  </td>
                </tr>
              ) : (
                (paginatedData as BankTransaction[]).map(txn => (
                  <tr key={txn.transaction_id}>
                    <td className="code-identifier">{txn.transaction_id}</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{txn.transaction_date}</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{txn.description}</td>
                    <td style={{ fontWeight: 600 }}>{txn.customer_name}</td>
                    <td className="code-identifier" style={{ color: txn.reference ? 'var(--text-main)' : 'var(--text-muted)' }}>
                      {txn.reference || '—'}
                    </td>
                    <td className="amount-cell">
                      {txn.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{txn.currency}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="table-pagination">
        <div className="pagination-text">
          Showing <strong>{activeDataset.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}</strong> to{' '}
          <strong>{Math.min(currentPage * ITEMS_PER_PAGE, activeDataset.length)}</strong> of{' '}
          <strong>{activeDataset.length}</strong> records
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
