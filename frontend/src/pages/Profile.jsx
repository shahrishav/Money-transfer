import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateProfile, deleteAccount } from '../services/api';
import toast from 'react-hot-toast';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user.full_name || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await updateProfile({ full_name: fullName });
      const updatedUser = res.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This cannot be undone.')) return;
    if (!window.confirm('This will permanently deactivate your account. Are you absolutely sure?')) return;
    try {
      await deleteAccount();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.success('Account deleted');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete account');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>My Profile</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: editing ? '1fr 1fr' : '1fr', gap: 24, maxWidth: editing ? 900 : 500 }}>

        {/* Profile Info Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'var(--accent)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32, fontWeight: 800, fontFamily: 'Syne', flexShrink: 0,
            }}>
              {user.full_name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: 22 }}>{user.full_name}</h2>
              <p style={{ color: 'var(--text2)', fontSize: 14 }}>{user.email}</p>
              <span className="badge badge-success" style={{ marginTop: 6, display: 'inline-block' }}>
                Active
              </span>
            </div>
          </div>

          {[
            ['User ID',        `#${user.id}`],
            ['Full Name',      user.full_name],
            ['Email Address',  user.email],
            ['Account Status', 'Active'],
          ].map(([label, value]) => (
            <div key={label} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '14px 0', borderBottom: '1px solid var(--border)',
            }}>
              <span style={{ color: 'var(--text2)', fontSize: 14 }}>{label}</span>
              <span style={{ fontWeight: 600, fontSize: 14 }}>
                {label === 'Account Status'
                  ? <span className="badge badge-success">{value}</span>
                  : value}
              </span>
            </div>
          ))}

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button
              onClick={() => { setEditing(true); setFullName(user.full_name); setError(''); }}
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              Edit Profile
            </button>
            <button
              onClick={handleDelete}
              className="btn btn-danger"
              style={{ flex: 1 }}
            >
              Delete Account
            </button>
          </div>
        </div>

        {/* Edit Form */}
        {editing && (
          <div className="card" style={{ borderTop: '3px solid var(--accent)' }}>
            <h2 style={{ marginBottom: 20, fontSize: 20 }}>Edit Profile</h2>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={handleUpdate}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  style={{ background: '#f3f4f6', cursor: 'not-allowed', color: 'var(--text2)' }}
                />
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                  Email cannot be changed
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}