import { useState, useEffect } from 'react';
import { getTransactions, markAsPaid } from '../services/api';
import toast from 'react-hot-toast';

export default function Transactions() {
  const [data, setData] = useState({ summary: null, transactions: [] });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ start_date: '', end_date: '', status: '' });

  const load = async (f = {}) => {
    setLoading(true);
    try {
      const params = {};
      if (f.start_date) params.start_date = f.start_date;
      if (f.end_date)   params.end_date   = f.end_date;
      if (f.status)     params.status     = f.status;
      const res = await getTransactions(params);
      setData(res.data);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleMarkPaid = async (id) => {
    if (!window.confirm('Mark this transaction as paid?')) return;
    try {
      await markAsPaid(id);
      toast.success('Transaction marked as paid!');
      load(filters);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark as paid');
    }
  };

  const handleFilter = (e) => {
    e.preventDefault();
    load(filters);
  };

  const statusColor = (status) => {
    if (status === 'paid')      return 'success';
    if (status === 'completed') return 'info';
    if (status === 'pending')   return 'warning';
    return 'danger';
  };

  return (
    <div>
      <div className="page-header">
        <h1>Transaction Report</h1>
      </div>

      {/* Summary Cards */}
      {data.summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total',      value: data.summary.total_transactions,                     color: '#6366f1' },
            { label: 'Pending',    value: data.summary.pending,                                color: '#f59e0b' },
            { label: 'Completed',  value: data.summary.completed,                              color: '#3b82f6' },
            { label: 'Paid',       value: data.summary.paid,                                   color: '#10b981' },
            { label: 'Total JPY',  value: `¥${data.summary.total_jpy?.toLocaleString()}`,      color: '#e94560' },
            { label: 'Total NPR',  value: `Rs.${data.summary.total_npr?.toLocaleString()}`,    color: '#0f3460' },
            { label: 'Total Fees', value: `Rs.${data.summary.total_fees?.toLocaleString()}`,   color: '#8b5cf6' },
          ].map(s => (
            <div key={s.label} className="card" style={{ borderTop: `3px solid ${s.color}`, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 20, fontFamily: 'Syne', fontWeight: 700, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ marginBottom: 24 }}>
        <form onSubmit={handleFilter} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 150 }}>
            <label>Start Date</label>
            <input type="date" value={filters.start_date}
              onChange={e => setFilters({ ...filters, start_date: e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 150 }}>
            <label>End Date</label>
            <input type="date" value={filters.end_date}
              onChange={e => setFilters({ ...filters, end_date: e.target.value })} />
          </div>
          <div className="form-group" style={{ margin: 0, flex: 1, minWidth: 130 }}>
            <label>Status</label>
            <select value={filters.status}
              onChange={e => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="paid">Paid</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary">Filter</button>
          <button type="button" className="btn btn-outline"
            onClick={() => { setFilters({ start_date: '', end_date: '', status: '' }); load(); }}>
            Reset
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="loading">Loading transactions...</div>
        ) : data.transactions.length === 0 ? (
          <div className="empty-state">
            <h3>No transactions found</h3>
            <p>Try changing your filters or send money to create a transaction</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Sender</th>
                  <th>Receiver</th>
                  <th>Bank</th>
                  <th>JPY</th>
                  <th>NPR</th>
                  <th>Fee</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map(tx => (
                  <tr key={tx.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text2)' }}>#{tx.id}</td>
                    <td style={{ fontWeight: 600 }}>{tx.sender_name}</td>
                    <td>{tx.receiver_name}</td>
                    <td style={{ fontSize: 12, color: 'var(--text2)' }}>{tx.bank_name}</td>
                    <td style={{ fontWeight: 600 }}>¥{parseFloat(tx.amount_jpy).toLocaleString()}</td>
                    <td>Rs.{parseFloat(tx.amount_npr).toLocaleString()}</td>
                    <td style={{ color: 'var(--warning)' }}>Rs.{parseFloat(tx.service_fee).toLocaleString()}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent)' }}>
                      Rs.{parseFloat(tx.total_amount).toLocaleString()}
                    </td>
                    <td>
                      <span className={`badge badge-${statusColor(tx.status)}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text2)' }}>
                      {new Date(tx.created_at).toLocaleDateString('en-NP', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </td>
                    <td>
                      {tx.status === 'completed' && (
                        <button
                          onClick={() => handleMarkPaid(tx.id)}
                          className="btn btn-success"
                          style={{ padding: '5px 12px', fontSize: 12 }}
                        >
                          Mark Paid
                        </button>
                      )}
                      {tx.status === 'paid' && (
                        <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>
                          ✓ Paid
                        </span>
                      )}
                      {tx.status === 'pending' && (
                        <span style={{ fontSize: 12, color: 'var(--warning)' }}>
                          Awaiting claim
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}