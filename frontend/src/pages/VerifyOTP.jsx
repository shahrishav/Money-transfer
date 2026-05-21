import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { verifyOTP } from '../services/api';
import toast from 'react-hot-toast';

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const [otp_code, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await verifyOTP({ email, otp_code });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      toast.success('Email verified successfully!');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
          <h1 style={{ fontSize: 28 }}>Verify Email</h1>
          <p style={{ color: 'var(--text2)', marginTop: 8 }}>
            We sent a 6-digit OTP to<br />
            <strong style={{ color: 'var(--text)' }}>{email}</strong>
          </p>
        </div>
        <div className="card">
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>OTP Code</label>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp_code}
                onChange={e => setOtp(e.target.value)}
                maxLength={6}
                style={{ fontSize: 24, letterSpacing: 8, textAlign: 'center', padding: '16px' }}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}