import { useState, useEffect } from 'react';
import { getSenders, createSender, updateSender, deleteSender, getProvinces, getDistricts } from '../services/api';
import toast from 'react-hot-toast';

const empty = {
  full_name: '', phone: '', address: '', state: '', district: '',
  municipality: '', ward_number: '', date_of_birth: '',
  id_number: '', id_issue_date: '', father_spouse_name: '',
};

export default function Senders() {
  const [senders, setSenders] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
    getProvinces().then(r => setProvinces(r.data.provinces)).catch(() => {});
  }, []);

  const load = () => getSenders().then(r => setSenders(r.data.senders)).catch(() => {});

  const handleProvinceChange = async (province) => {
    setForm(f => ({ ...f, state: province, district: '' }));
    if (province) {
      const res = await getDistricts(province);
      setDistricts(res.data.districts);
    }
  };

  const openCreate = () => { setEditing(null); setForm(empty); setError(''); setShowModal(true); };

  const openEdit = async (s) => {
    setEditing(s.id);
    setForm({
      full_name: s.full_name, phone: s.phone, address: s.address,
      state: s.state, district: s.district, municipality: s.municipality,
      ward_number: s.ward_number,
      date_of_birth: s.date_of_birth?.split('T')[0] || '',
      id_number: s.id_number,
      id_issue_date: s.id_issue_date?.split('T')[0] || '',
      father_spouse_name: s.father_spouse_name,
    });
    if (s.state) {
      const res = await getDistricts(s.state);
      setDistricts(res.data.districts);
    }
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (editing) {
        await updateSender(editing, form);
        toast.success('Sender updated!');
      } else {
        await createSender(form);
        toast.success('Sender created!');
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this sender?')) return;
    await deleteSender(id);
    toast.success('Sender deleted');
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Senders</h1>
        <button onClick={openCreate} className="btn btn-primary">+ Add Sender</button>
      </div>

      <div className="card">
        {senders.length === 0 ? (
          <div className="empty-state">
            <h3>No senders yet</h3>
            <p>Add a sender to start sending money</p>
            <button onClick={openCreate} className="btn btn-primary" style={{ marginTop: 16 }}>Add Sender</button>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th><th>Phone</th><th>District</th>
                  <th>Province</th><th>ID Number</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {senders.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.full_name}</td>
                    <td>{s.phone}</td>
                    <td>{s.district}</td>
                    <td>{s.state}</td>
                    <td style={{ fontSize: 13 }}>{s.id_number}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => openEdit(s)} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }}>Edit</button>
                        <button onClick={() => handleDelete(s.id)} className="btn btn-danger" style={{ padding: '6px 14px', fontSize: 13 }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editing ? 'Edit Sender' : 'Add Sender'}</h2>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Phone (Nepal)</label>
                  <input type="text" placeholder="98XXXXXXXX" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label>Address</label>
                <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Province</label>
                  <select value={form.state} onChange={e => handleProvinceChange(e.target.value)} required>
                    <option value="">-- Select Province --</option>
                    {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>District</label>
                  <select value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} required disabled={!form.state}>
                    <option value="">-- Select District --</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Municipality</label>
                  <input type="text" value={form.municipality} onChange={e => setForm({ ...form, municipality: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Ward Number</label>
                  <input type="number" min="1" max="33" value={form.ward_number} onChange={e => setForm({ ...form, ward_number: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Father/Spouse Name</label>
                  <input type="text" value={form.father_spouse_name} onChange={e => setForm({ ...form, father_spouse_name: e.target.value })} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Citizenship ID</label>
                  <input type="text" placeholder="XX-XX-XX-XXXXX" value={form.id_number} onChange={e => setForm({ ...form, id_number: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>ID Issue Date</label>
                  <input type="date" value={form.id_issue_date} onChange={e => setForm({ ...form, id_issue_date: e.target.value })} required />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                  {loading ? 'Saving...' : editing ? 'Update Sender' : 'Create Sender'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}