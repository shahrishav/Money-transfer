import { useState, useEffect } from 'react';
import { lookupPIN, receiveMoney, getProvinces, getDistricts, getBanks } from '../services/api';
import toast from 'react-hot-toast';

const emptyForm = {
  full_name: '', phone: '', bank_name: '', bank_account: '',
  address: '', state: '', district: '', municipality: '',
  ward_number: '', date_of_birth: '', id_number: '',
  id_issue_date: '', father_spouse_name: '',
};

export default function ReceiveMoney() {
  const [step, setStep]         = useState(1);
  const [pin, setPin]           = useState('');
  const [txInfo, setTxInfo]     = useState(null);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [banks, setBanks]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [receipt, setReceipt]   = useState(null);
  const [form, setForm]         = useState(emptyForm);

  useEffect(() => {
    getProvinces().then(r => setProvinces(r.data.provinces)).catch(() => {});
    getBanks().then(r => setBanks(r.data.banks)).catch(() => {});
  }, []);

  const handleProvinceChange = async (province) => {
    setForm(f => ({ ...f, state: province, district: '' }));
    if (province) {
      try {
        const res = await getDistricts(province);
        setDistricts(res.data.districts);
      } catch {}
    }
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await lookupPIN({ pin_code: pin });
      setTxInfo(res.data);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await receiveMoney({ pin_code: pin, ...form });
      setReceipt(res.data.receipt);
      setStep(3);
      toast.success('Money received successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to receive money');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep(1); setPin(''); setTxInfo(null);
    setForm(emptyForm); setError(''); setReceipt(null);
  };

  // ── Step 3: Receipt ──────────────────────────────────────────
  if (step === 3 && receipt) {
    return (
      <div>
        <h1 style={{ marginBottom: 24 }}>Money Received!</h1>
        <div className="card" style={{ maxWidth: 480, borderTop: '4px solid var(--success)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 56 }}>🎉</div>
            <h2 style={{ color: 'var(--success)', fontSize: 24, marginTop: 8 }}>Transfer Complete</h2>
            <p style={{ color: 'var(--text2)', fontSize: 14, marginTop: 4 }}>
              Transaction #{receipt.transaction_id}
            </p>
          </div>

          {[
            ['Receiver Name', receipt.receiver_name],
            ['Bank',          receipt.bank_name],
            ['Account',       receipt.bank_account],
            ['Amount (NPR)',  `Rs.${parseFloat(receipt.amount_npr).toLocaleString()}`],
            ['Service Fee',   `Rs.${parseFloat(receipt.service_fee).toLocaleString()}`],
            ['Total Amount',  `Rs.${parseFloat(receipt.total_amount).toLocaleString()}`],
          ].map(([label, value]) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '12px 0', borderBottom: '1px solid var(--border)',
            }}>
              <span style={{ color: 'var(--text2)', fontSize: 14 }}>{label}</span>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{value}</span>
            </div>
          ))}

          <div style={{ marginTop: 16, padding: 12, background: '#d1fae5', borderRadius: 8, fontSize: 13, color: '#065f46', textAlign: 'center' }}>
            ✅ Status has been updated to <strong>Completed</strong>
          </div>

          <button onClick={reset} className="btn btn-primary btn-full" style={{ marginTop: 20 }}>
            Receive Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Receive Money</h1>
      </div>

      {/* ── Step 1: Enter PIN ─────────────────────────────────── */}
      {step === 1 && (
        <div className="card" style={{ maxWidth: 440 }}>
          <h2 style={{ marginBottom: 8, fontSize: 20 }}>Enter Claim PIN</h2>
          <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24 }}>
            Enter the 10-digit PIN provided by the sender
          </p>
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={handleLookup}>
            <div className="form-group">
              <label>10-Digit PIN</label>
              <input
                type="text"
                placeholder="Enter 10-digit PIN"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
                style={{ fontSize: 28, letterSpacing: 6, textAlign: 'center', padding: '16px' }}
                required
              />
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                {pin.length}/10 digits entered
              </span>
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading || pin.length !== 10}
            >
              {loading ? 'Looking up...' : 'Verify PIN →'}
            </button>
          </form>
        </div>
      )}

      {/* ── Step 2: Receiver form + sender info ──────────────── */}
      {step === 2 && txInfo && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

          {/* Left — receiver details form */}
          <div className="card">
            <h2 style={{ marginBottom: 4, fontSize: 20 }}>Fill Your Details</h2>
            <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 24 }}>
              Complete your information to claim the money
            </p>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={handleReceive}>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" value={form.full_name}
                    onChange={e => setForm({ ...form, full_name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="text" placeholder="98XXXXXXXX" value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Bank Name</label>
                  <select value={form.bank_name}
                    onChange={e => setForm({ ...form, bank_name: e.target.value })} required>
                    <option value="">-- Select Bank --</option>
                    {banks.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Bank Account Number</label>
                  <input type="text" value={form.bank_account}
                    onChange={e => setForm({ ...form, bank_account: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label>Address</label>
                <input type="text" placeholder="Tole / Street name" value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Province</label>
                  <select value={form.state}
                    onChange={e => handleProvinceChange(e.target.value)} required>
                    <option value="">-- Select Province --</option>
                    {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>District</label>
                  <select value={form.district}
                    onChange={e => setForm({ ...form, district: e.target.value })}
                    required disabled={!form.state}>
                    <option value="">-- Select District --</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Municipality</label>
                  <input type="text" value={form.municipality}
                    onChange={e => setForm({ ...form, municipality: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Ward Number</label>
                  <input type="number" min="1" max="33" value={form.ward_number}
                    onChange={e => setForm({ ...form, ward_number: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input type="date" value={form.date_of_birth}
                    onChange={e => setForm({ ...form, date_of_birth: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Father / Spouse Name</label>
                  <input type="text" value={form.father_spouse_name}
                    onChange={e => setForm({ ...form, father_spouse_name: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Citizenship / ID Number</label>
                  <input type="text" placeholder="XX-XX-XX-XXXXX" value={form.id_number}
                    onChange={e => setForm({ ...form, id_number: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>ID Issue Date</label>
                  <input type="date" value={form.id_issue_date}
                    onChange={e => setForm({ ...form, id_issue_date: e.target.value })} required />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setStep(1)} className="btn btn-outline">
                  ← Back
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                  {loading ? 'Processing...' : 'Claim Money ✓'}
                </button>
              </div>
            </form>
          </div>

          {/* Right — sender info + transaction details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Sender Details */}
            <div className="card" style={{ borderTop: '3px solid var(--accent)' }}>
              <h3 style={{ marginBottom: 16, fontSize: 15 }}>Sent By</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: 'var(--accent)', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 20, fontWeight: 800, fontFamily: 'Syne', flexShrink: 0,
                }}>
                  {txInfo.sender?.full_name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{txInfo.sender?.full_name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)' }}>{txInfo.sender?.phone}</div>
                </div>
              </div>
              {[
                ['Address',  txInfo.sender?.address],
                ['District', txInfo.sender?.district],
                ['Province', txInfo.sender?.state],
              ].map(([label, value]) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13,
                }}>
                  <span style={{ color: 'var(--text2)' }}>{label}</span>
                  <span style={{ fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Transaction Details */}
            <div className="card" style={{ borderTop: '3px solid var(--accent2)' }}>
              <h3 style={{ marginBottom: 16, fontSize: 15 }}>Transaction Details</h3>
              {[
                ['Amount (NPR)', `Rs.${parseFloat(txInfo.transaction.amount_npr).toLocaleString()}`],
                ['Service Fee',  `Rs.${parseFloat(txInfo.transaction.service_fee).toLocaleString()}`],
                ['Total',        `Rs.${parseFloat(txInfo.transaction.total_amount).toLocaleString()}`],
              ].map(([label, value]) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: '1px solid var(--border)',
                }}>
                  <span style={{ color: 'var(--text2)', fontSize: 14 }}>{label}</span>
                  <span style={{ fontWeight: 700 }}>{value}</span>
                </div>
              ))}
              <div style={{ marginTop: 12, padding: '10px', background: '#fef3c7', borderRadius: 8, fontSize: 12, color: '#92400e' }}>
                ⚠️ Fill all details correctly to claim
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}