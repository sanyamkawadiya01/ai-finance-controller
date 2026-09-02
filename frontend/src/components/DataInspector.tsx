import React, { useState } from 'react';
import type { Invoice, BankTransaction } from '../types';
import { FileText, CreditCard } from 'lucide-react';

interface Props {
  invoices: Invoice[];
  transactions: BankTransaction[];
}

export const DataInspector: React.FC<Props> = ({ invoices, transactions }) => {
  const [subTab, setSubTab] = useState<'invoices' | 'transactions'>('invoices');

  return (
    <div className="glass-panel" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
        <button
          onClick={() => setSubTab('invoices')}
          style={{
            background: subTab === 'invoices' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: subTab === 'invoices' ? '#38bdf8' : '#94a3b8',
            border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          <FileText size={16} /> Invoices ({invoices.length})
        </button>

        <button
          onClick={() => setSubTab('transactions')}
          style={{
            background: subTab === 'transactions' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: subTab === 'transactions' ? '#38bdf8' : '#94a3b8',
            border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '6px'
          }}
        >
          <CreditCard size={16} /> Bank Transactions ({transactions.length})
        </button>
      </div>

      <div className="table-container">
        {subTab === 'invoices' ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Customer ID</th>
                <th>Customer Name</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Currency</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map(inv => (
                <tr key={inv.invoice_id}>
                  <td style={{ fontWeight: 600, color: '#38bdf8' }}>{inv.invoice_id}</td>
                  <td>{inv.customer_id}</td>
                  <td>{inv.customer_name}</td>
                  <td>{inv.invoice_date}</td>
                  <td>{inv.due_date}</td>
                  <td style={{ fontWeight: 600 }}>{inv.invoice_amount.toFixed(2)}</td>
                  <td>{inv.currency}</td>
                </tr>
              ))}
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
                <th>Amount</th>
                <th>Currency</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(txn => (
                <tr key={txn.transaction_id}>
                  <td style={{ fontWeight: 600, color: '#818cf8' }}>{txn.transaction_id}</td>
                  <td>{txn.transaction_date}</td>
                  <td style={{ fontSize: '0.8125rem', color: '#cbd5e1' }}>{txn.description}</td>
                  <td>{txn.customer_name}</td>
                  <td>{txn.reference || '—'}</td>
                  <td style={{ fontWeight: 600 }}>{txn.amount.toFixed(2)}</td>
                  <td>{txn.currency}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
