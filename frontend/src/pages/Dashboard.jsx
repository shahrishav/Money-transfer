import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTransactions, getSenders, getReceivers } from '../services/api';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const [senderCount, setSenderCount] = useState(0);
  const [receiverCount, setReceiverCount] = useState(0);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    getTransactions().then(r => {
      setSummary(r.data.summary);
      setRecent(r.data.transactions.slice(0, 5));
    }).catch(() => {});
    getSenders().then(r => setSenderCount(r.data.senders.length)).catch(() => {});
    getReceivers().then(r => setReceiverCount(r.data.receivers.length)).catch(() => {});
  }, []);

  const stats = [
    { label: 'Total Sent (JPY)', value: `¥${(summary?.total_jpy || 0).toLocaleString()}`, color: '#e94560' },
    { label: 'Total Received (NPR)', value: `Rs.${(summary?.total_npr || 0).toLocaleString()}`, color: '#0f3460' },
    { label: 'Total Fees (NPR)', value: `Rs.${(summary?.total_fees || 0).toLocaleString()}`, color: '#f59e0b' },
    { label: 'Transactions', value: summary?.total_transactions || 0, color: '#10b981' },
    { label: 'Completed', value: summary?.completed || 0, color: '#10b981' },
    { label: 'Pending', value: summary?.pending || 0, color: '#f59e0b' },
    { label: 'Senders', value: senderCount, color: '#6366f1' },
    { label: 'Receivers', value: receiverCount, color: '#8b5cf6' },
  ];

  return (
    <div>
      {/* Welcome */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 32, marginBottom: 6 }}>
          Welcome back, {user.full_name?.split(' ')[0]} 
        </h1>
        <p style={{ color: 'var(--text2)' }}>Here is your remittance overview</p>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
        <Link to="/send-money" className="btn btn-primary">
          ↑ Send Money
        </Link>
        <Link to="/receive-money" className="btn btn-secondary">
          ↓ Receive Money
        </Link>
        <Link to="/transactions" className="btn btn-outline">
          ≡ View All Transactions
        </Link>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        {stats.map((s, i) => (
          <div key={i} className="card" style={{ borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontFamily: 'Syne', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="page-header">
          <h2 style={{ fontSize: 20 }}>Recent Transactions</h2>
          <Link to="/transactions" style={{ color: 'var(--accent)', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            View All →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="empty-state">
            <h3>No transactions yet</h3>
            <p>Send your first remittance to get started</p>
            <Link to="/send-money" className="btn btn-primary" style={{ marginTop: 16 }}>
              Send Money Now
            </Link>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Sender</th>
                  <th>Receiver</th>
                  <th>Amount (JPY)</th>
                  <th>Amount (NPR)</th>
                  <th>Fee</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(tx => (
                  <tr key={tx.id}>
                    <td>{tx.sender_name}</td>
                    <td>{tx.receiver_name}</td>
                    <td>¥{parseFloat(tx.amount_jpy).toLocaleString()}</td>
                    <td>Rs.{parseFloat(tx.amount_npr).toLocaleString()}</td>
                    <td>Rs.{parseFloat(tx.service_fee).toLocaleString()}</td>
                    <td>
                      <span className={`badge badge-${tx.status === 'completed' ? 'success' : 'warning'}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td>{new Date(tx.created_at).toLocaleDateString()}</td>
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