import { useState, useEffect } from 'react';
import { getSenders, getReceivers, calculateFee, sendMoney } from '../services/api';
import toast from 'react-hot-toast';

export default function SendMoney() {
  const [senders, setSenders] = useState([]);
  const [receivers, setReceivers] = useState([]);
  const [form, setForm] = useState({ sender_id: '', receiver_id: '', amount_jpy: '' });
  const [feeInfo, setFeeInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getSenders().then(r => setSenders(r.data.senders)).catch(() => {});
    getReceivers().then(r => setReceivers(r.data.receivers)).catch(() => {});
  }, []);

  const handleAmountChange = async (amount) => {
    setForm(f => ({ ...f, amount_jpy: amount }));
    if (amount > 0) {
      try {
        const res = await calculateFee({ amount_jpy: parseFloat(amount) });
        setFeeInfo(res.data);
      } catch {}
    } else {
      setFeeInfo(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await sendMoney({
        sender_id: parseInt(form.sender_id),
        receiver_id: parseInt(form.receiver_id),
        amount_jpy: parseFloat(form.amount_jpy),
      });
      setResult(res.data);
      toast.success('Money sent successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send money');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div>
        <h1 style={{ marginBottom: 24 }}>Money Sent!</h1>
        <div className="card" style={{ maxWidth: 520, borderTop: '4px solid var(--success)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>✅</div>
            <h2 style={{ color: 'var(--success)', fontSize: 24 }}>Transfer Successful</h2>
          </div>

          {/* PIN Box */}
          <div style={{ background: '#1a1a2e', borderRadius: 12, padding: '20px', marginBottom: 24, textAlign: 'center' }}>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              10-Digit Claim PIN
            </div>
            <div style={{ color: 'var(--accent)', fontSize: 36, fontFamily: 'Syne', fontWeight: 800, letterSpacing: 6 }}>
              {result.pin_code}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 8 }}>
              Share this PIN with the receiver to claim money
            </div>
          </div>

          {/* Transaction Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              ['Amount (JPY)', `¥${result.transaction.amount_jpy.toLocaleString()}`],
              ['Forex Rate', '1 JPY = 0.92 NPR'],
              ['Amount (NPR)', `Rs.${result.transaction.amount_npr.toLocaleString()}`],
              ['Service Fee', `Rs.${result.transaction.service_fee.toLocaleString()}`],
              ['Total Amount', `Rs.${result.transaction.total_amount.toLocaleString()}`],
              ['Status', result.transaction.status],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text2)', fontSize: 14 }}>{label}</span>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{value}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 16, padding: '12px', background: '#fef3c7', borderRadius: 8, fontSize: 13, color: '#92400e' }}>
            ⚠️ Save your PIN code. It cannot be recovered.
          </div>

          <button onClick={() => setResult(null)} className="btn btn-primary btn-full" style={{ marginTop: 20 }}>
            Send Another Transfer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Send Money</h1>
        <span style={{ color: 'var(--text2)', fontSize: 14 }}>Japan → Nepal | Rate: 1 JPY = 0.92 NPR</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>

        {/* Form */}
        <div className="card">
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Select Sender</label>
              <select value={form.sender_id} onChange={e => setForm({ ...form, sender_id: e.target.value })} required>
                <option value="">-- Choose Sender --</option>
                {senders.map(s => (
                  <option key={s.id} value={s.id}>{s.full_name} — {s.phone}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Select Receiver</label>
              <select value={form.receiver_id} onChange={e => setForm({ ...form, receiver_id: e.target.value })} required>
                <option value="">-- Choose Receiver --</option>
                {receivers.map(r => (
                  <option key={r.id} value={r.id}>{r.full_name} — {r.bank_name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Amount (JPY ¥)</label>
              <input
                type="number"
                placeholder="Enter amount in Japanese Yen"
                value={form.amount_jpy}
                onChange={e => handleAmountChange(e.target.value)}
                min="1"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading || !form.sender_id || !form.receiver_id || !form.amount_jpy}>
              {loading ? 'Sending...' : '↑ Send Money'}
            </button>
          </form>
        </div>

        {/* Fee Calculator */}
        <div>
          <div className="card" style={{ borderTop: '3px solid var(--accent)' }}>
            <h3 style={{ marginBottom: 16, fontSize: 16 }}>Fee Calculator</h3>
            {feeInfo ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['You Send', `¥${parseFloat(feeInfo.amount_jpy).toLocaleString()}`, false],
                  ['Forex Rate', '1 JPY = 0.92 NPR', false],
                  ['Converted', `Rs.${parseFloat(feeInfo.amount_npr).toLocaleString()}`, false],
                  ['Service Fee', `Rs.${parseFloat(feeInfo.service_fee).toLocaleString()}`, false],
                  ['Total', `Rs.${parseFloat(feeInfo.total_amount).toLocaleString()}`, true],
                ].map(([label, value, bold]) => (
                  <div key={label} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: bold ? '12px' : '8px 0',
                    borderBottom: bold ? 'none' : '1px solid var(--border)',
                    background: bold ? '#1a1a2e' : 'transparent',
                    borderRadius: bold ? 8 : 0,
                    paddingLeft: bold ? 12 : 0,
                    paddingRight: bold ? 12 : 0,
                    marginTop: bold ? 4 : 0,
                  }}>
                    <span style={{ fontSize: 14, color: bold ? 'rgba(255,255,255,0.7)' : 'var(--text2)' }}>{label}</span>
                    <span style={{ fontWeight: 700, fontSize: bold ? 16 : 14, color: bold ? 'var(--accent)' : 'var(--text)' }}>{value}</span>
                  </div>
                ))}
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                  {feeInfo.fee_breakdown?.rule}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text2)', fontSize: 14 }}>
                Enter an amount to see fee breakdown
              </div>
            )}
          </div>

          {/* Fee Rules */}
          <div className="card" style={{ marginTop: 16 }}>
            <h3 style={{ marginBottom: 12, fontSize: 15 }}>Service Fee Rules</h3>
            {[
              ['NPR 0 – 100,000', 'NPR 500'],
              ['NPR 100,001 – 200,000', 'NPR 1,000'],
              ['Above NPR 200,000', 'NPR 3,000'],
            ].map(([range, fee]) => (
              <div key={range} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                <span style={{ color: 'var(--text2)' }}>{range}</span>
                <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{fee}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}