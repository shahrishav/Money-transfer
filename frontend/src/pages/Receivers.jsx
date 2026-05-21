import { useState, useEffect } from 'react';
import { getReceivers, createReceiver, updateReceiver, deleteReceiver, getProvinces, getDistricts, getBanks } from '../services/api';
import toast from 'react-hot-toast';

const empty = {
  full_name: '', phone: '', bank_name: '', bank_account: '',
  address: '', state: '', district: '', municipality: '',
  ward_number: '', date_of_birth: '', id_number: '',
  id_issue_date: '', father_spouse_name: '',
};

export default function Receivers() {
  const [receivers, setReceivers] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [banks, setBanks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    load();
    getProvinces().then(r => setProvinces(r.data.provinces)).catch(() => {});
    getBanks().then(r => setBanks(r.data.banks)).catch(() => {});
  }, []);

  const load = () => getReceivers().then(r => setReceivers(r.data.receivers)).catch(() => {});

  const handleProvinceChange = async (province) => {
    setForm(f => ({ ...f, state: province, district: '' }));
    if (province) {
      const res = await getDistricts(province);
      setDistricts(res.data.districts);
    }
  };

  const openCreate = () => { setEditing(null); setForm(empty); setError(''); setShowModal(true); };

  const openEdit = async (r) => {
    setEditing(r.id);
    setForm({
      full_name: r.full_name, phone: r.phone,
      bank_name: r.bank_name, bank_account: r.bank_account,
      address: r.address, state: r.state, district: r.district,
      municipality: r.municipality, ward_number: r.ward_number,
      date_of_birth: r.date_of_birth?.split('T')[0] || '',
      id_number: r.id_number,
      id_issue_date: r.id_issue_date?.split('T')[0] || '',
      father_spouse_name: r.father_spouse_name,
    });
    if (r.state) {
      const res = await getDistricts(r.state);
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
        await updateReceiver(editing, form);
        toast.success('Receiver updated!');
      } else {
        await createReceiver(form);
        toast.success('Receiver created!');
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this receiver?')) return;
    await deleteReceiver(id);
    toast.success('Receiver deleted');
    load();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Receivers</h1>
        <button onClick={openCreate} className="btn btn-primary">+ Add Receiver</button>
      </div>

      <div className="card">
        {receivers.length === 0 ? (
          <div className="empty-state">
            <h3>No receivers yet</h3>
            <p>Add a receiver to start sending money to Nepal</p>
            <button onClick={openCreate} className="btn btn-primary" style={{ marginTop: 16 }}>Add Receiver</button>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th><th>Phone</th><th>Bank</th>
                  <th>Account</th><th>District</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {receivers.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.full_name}</td>
                    <td>{r.phone}</td>
                    <td style={{ fontSize: 13 }}>{r.bank_name}</td>
                    <td style={{ fontSize: 13 }}>{r.bank_account}</td>
                    <td>{r.district}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => openEdit(r)} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 13 }}>Edit</button>
                        <button onClick={() => handleDelete(r.id)} className="btn btn-danger" style={{ padding: '6px 14px', fontSize: 13 }}>Delete</button>
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
            <h2>{editing ? 'Edit Receiver' : 'Add Receiver'}</h2>
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
              <div className="form-row">
                <div className="form-group">
                  <label>Bank Name</label>
                  <select value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} required>
                    <option value="">-- Select Bank --</option>
                    {banks.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Bank Account Number</label>
                  <input type="text" value={form.bank_account} onChange={e => setForm({ ...form, bank_account: e.target.value })} required />
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
                  {loading ? 'Saving...' : editing ? 'Update Receiver' : 'Create Receiver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}