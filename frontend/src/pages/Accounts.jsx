import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../lib/api';
import { UserPlus, Trash2, Edit2, Activity, X, ShieldCheck, Star, Eye, EyeOff } from 'lucide-react';
import { useToast } from '../components/Toast';

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [capitals, setCapitals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [healthStatus, setHealthStatus] = useState({});
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [checkingSingle, setCheckingSingle] = useState({});
  const [loading, setLoading] = useState(true);
  const [showFields, setShowFields] = useState({});
  const [editSecrets, setEditSecrets] = useState({});
  const [banks, setBanks] = useState([]);
  const toast = useToast();
  const toggleShow = (name) => setShowFields(prev => ({ ...prev, [name]: !prev[name] }));

  const fetchAccounts = () => {
    setLoading(true);
    api.get('/api/accounts/')
      .then(r => setAccounts(r.data))
      .catch(() => toast.error('Failed to load accounts'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAccounts();
    api.get('/api/accounts/capitals').then(r => setCapitals(r.data)).catch(() => {});
    api.get('/api/accounts/all-banks').then(r => setBanks(r.data)).catch(() => {});
  }, []);

  const handleHealthCheck = () => {
    setCheckingHealth(true);
    api.post('/api/accounts/health-check')
      .then(res => {
        const s = {};
        let ok = 0, fail = 0;
        res.data.forEach(r => { s[r.id] = r; r.status === 'OK' ? ok++ : fail++; });
        setHealthStatus(s);
        toast.success(`${ok} OK, ${fail} failed`);
      })
      .catch(() => toast.error('Health check failed'))
      .finally(() => setCheckingHealth(false));
  };

  const handleSingleCheck = (id) => {
    setCheckingSingle(prev => ({ ...prev, [id]: true }));
    api.post(`/api/accounts/${id}/health`)
      .then(res => {
        setHealthStatus(prev => ({ ...prev, [id]: res.data }));
        if (res.data.status === 'OK') toast.success(`${res.data.name} login OK`);
        else toast.error(`${res.data.name} login failed`);
      })
      .catch(() => toast.error('Check failed'))
      .finally(() => setCheckingSingle(prev => ({ ...prev, [id]: false })));
  };

  const toggleActive = (id) => {
    api.patch(`/api/accounts/${id}/toggle-active`).then(() => {
      fetchAccounts();
      window.dispatchEvent(new Event('accounts_updated'));
    });
  };

  const togglePrimary = (id) => {
    api.patch(`/api/accounts/${id}/set-primary`).then(() => {
      fetchAccounts();
      window.dispatchEvent(new Event('accounts_updated'));
    });
  };

  const handleEdit = (acc) => {
    setEditing(acc);
    setEditSecrets({});
    setShowFields({});
    api.get(`/api/accounts/${acc.id}/secrets`)
      .then(r => {
        setEditSecrets(r.data);
        setShowForm(true);
      })
      .catch(() => {
        setShowForm(true);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = Object.fromEntries(fd.entries());
    data.default_kitta = parseInt(data.default_kitta) || 10;
    const req = editing ? api.put(`/api/accounts/${editing.id}`, data) : api.post('/api/accounts/', data);
    req.then(() => {
      setShowForm(false); setEditing(null); fetchAccounts();
      window.dispatchEvent(new Event('accounts_updated'));
      toast.success(editing ? 'Updated' : 'Account added');
    }).catch(err => toast.error(err.response?.data?.detail || 'Save failed'));
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this account permanently?')) return;
    api.delete(`/api/accounts/${id}`)
      .then(() => { 
        fetchAccounts(); 
        window.dispatchEvent(new Event('accounts_updated'));
        toast.success('Deleted'); 
      })
      .catch(() => toast.error('Failed to delete'));
  };

  const inputStyle = { 
    background: '#F9FAFB', 
    border: '1px solid #E4E4E7', 
    borderRadius: 10, 
    padding: '10px 14px', 
    fontSize: 13, 
    color: '#000', 
    width: '100%', 
    outline: 'none',
    transition: 'border-color 0.2s'
  };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#000', marginBottom: '6px', letterSpacing: '-0.04em' }}>Family Accounts</h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: 500 }}>Manage and monitor your automated account suite</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button onClick={handleHealthCheck} disabled={checkingHealth}
            style={{ 
              padding: '12px 20px', borderRadius: '16px', fontSize: '14px', fontWeight: 700, 
              background: '#FFF', border: '1px solid #E4E4E7', color: '#000', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '10px', boxShadow: 'var(--shadow-sm)'
            }} className="btn-premium">
            <Activity size={18} className={checkingHealth ? 'animate-spin' : ''} />
            Health Check
          </button>
          <button onClick={() => { setEditing(null); setShowForm(true); }}
            style={{ 
              padding: '12px 24px', borderRadius: '16px', fontSize: '14px', fontWeight: 800, 
              background: '#000', color: '#FFF', border: 'none', cursor: 'pointer',
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
            }} className="btn-premium">
            + Add Account
          </button>
        </div>
      </div>

      {/* Form Overlay */}
      {showForm && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, overflowY: 'auto', background: 'rgba(15, 23, 42, 0.65)' }}>
          <div style={{ padding: '32px 16px' }}>
            <div className="page-enter" style={{ background: '#FFF', borderRadius: '32px', width: '100%', maxWidth: 580, margin: '0 auto', boxShadow: '0 24px 48px rgba(0,0,0,0.15)' }}>
            <div style={{ padding: '32px 36px 0 36px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#000', letterSpacing: '-0.02em' }}>{editing ? 'Edit Account' : 'Connect New Account'}</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>Link your MeroShare credentials securely</p>
              </div>
              <button onClick={() => setShowForm(false)} style={{ width: 32, height: 32, borderRadius: '50%', background: '#F9FAFB', border: 'none', color: '#A1A1AA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><X size={20} /></button>
            </div>
            <div style={{ overflowY: 'auto', padding: '0 36px 36px 36px' }}>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                { name: 'name', label: 'Display Name', placeholder: 'e.g. My Account', defaultValue: editing?.name },
                { name: 'username', label: 'Username', placeholder: 'ID Number', defaultValue: editing?.username },
                { name: 'password', label: 'Password', placeholder: '••••••••', type: 'password', required: !editing, defaultValue: editSecrets.password || '' },
                { name: 'crn', label: 'CRN', placeholder: 'Bank CRN', defaultValue: editing?.crn },
                { name: 'transaction_pin', label: 'Transaction PIN', placeholder: '••••••••', type: 'password', required: !editing, defaultValue: editSecrets.transaction_pin || '' },
                { name: 'default_kitta', label: 'Default Units', placeholder: '10', type: 'number', defaultValue: editing?.default_kitta || 10 },
              ].map(f => (
                <div key={f.name}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#000', marginBottom: '8px', display: 'block' }}>{f.label}</label>
                  <div style={{ position: 'relative' }}>
                    <input name={f.name} type={f.type === 'password' && showFields[f.name] ? 'text' : (f.type || 'text')} placeholder={f.placeholder} defaultValue={f.defaultValue}
                      required={f.required !== false} style={{ ...inputStyle, paddingRight: f.type === 'password' ? '36px' : inputStyle.paddingRight }} />
                    {f.type === 'password' && (
                      <button
                        type="button"
                        onClick={() => toggleShow(f.name)}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#A1A1AA', cursor: 'pointer', display: 'flex' }}>
                        {showFields[f.name] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div className="md:col-span-2">
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#000', marginBottom: '8px', display: 'block' }}>Capital (DP)</label>
                <select name="dp_id" defaultValue={editing?.dp_id} style={inputStyle}>
                  {capitals.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#000', marginBottom: '8px', display: 'block' }}>Bank (C-ASBA)</label>
                <select name="bank_name" defaultValue={editing?.bank_name || ''} style={inputStyle}>
                  <option value="">Select Bank</option>
                  {banks.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-2 pt-6 flex gap-4">
                <button type="submit" style={{ flex: 1, padding: '14px', borderRadius: '12px', fontSize: '14px', fontWeight: 800, background: '#000', color: '#FFF', border: 'none', cursor: 'pointer' }} className="btn-premium">
                  {editing ? 'Update Account' : 'Connect Account'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', fontSize: '14px', fontWeight: 800, background: '#F8F9FB', border: '1px solid #E4E4E7', color: '#000', cursor: 'pointer' }} className="btn-premium">Cancel</button>
              </div>
            </form>
            </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Account Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 180, borderRadius: '24px' }} />)
        ) : (
          accounts.map(acc => {
            const hs = healthStatus[acc.id];
            const isOk = !hs || hs.status === 'OK';
            return (
              <div key={acc.id} style={{ 
                background: '#FFF', borderRadius: '24px', padding: '24px', border: '1px solid #F1F1F4',
                boxShadow: 'var(--shadow-sm)', position: 'relative',
                display: 'flex', flexDirection: 'column', gap: '16px', transition: 'transform 0.2s'
              }} className="clickable-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ 
                      width: '48px', height: '48px', borderRadius: '50%', 
                      background: acc.active ? 'rgba(16,185,129,0.1)' : '#F3F4F6',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      color: acc.active ? '#047857' : '#9CA3AF',
                      fontSize: '18px', fontWeight: 800, textTransform: 'uppercase',
                      flexShrink: 0, position: 'relative'
                    }}>
                      {acc.name.charAt(0)}
                      <div style={{
                        position: 'absolute', bottom: -1, right: -1, width: 18, height: 18, borderRadius: '50%',
                        background: acc.active ? '#10B981' : '#EF4444', border: '2px solid #FFF',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        {acc.active ? <ShieldCheck size={11} color="#FFF" /> : <X size={11} color="#FFF" />}
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#000', letterSpacing: '-0.01em' }}>{acc.name}</div>
                        {acc.is_primary && (
                          <div style={{ background: '#000', color: '#FFF', fontSize: '8px', fontWeight: 900, padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>Primary</div>
                        )}
                      </div>
                      <div style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: 500 }}>{acc.username}</div>
                    </div>
                  </div>
                  <button onClick={() => toggleActive(acc.id)} style={{ 
                    fontSize: '10px', fontWeight: 800, padding: '4px 10px', borderRadius: '8px', 
                    background: acc.active ? '#FFF' : '#000', color: acc.active ? '#EF4444' : '#FFF',
                    border: acc.active ? '1px solid #FEE2E2' : 'none', cursor: 'pointer', textTransform: 'uppercase'
                  }} className="btn-premium">
                    {acc.active ? 'Disable' : 'Enable'}
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid #F9FAFB' }}>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Units</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#000' }}>{acc.default_kitta}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>Status</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isOk ? '#10B981' : '#EF4444' }} />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: isOk ? '#059669' : '#DC2626' }}>{isOk ? 'Healthy' : 'Error'}</span>
                    </div>
                  </div>
                </div>



                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: '8px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => handleSingleCheck(acc.id)} disabled={checkingSingle[acc.id]}
                      style={{ padding: '8px 12px', borderRadius: '10px', background: '#F8F9FB', border: '1px solid #E4E4E7', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#000' }}
                      className="icon-btn">
                      <Activity size={14} className={checkingSingle[acc.id] ? 'animate-spin' : ''} /> Check
                    </button>
                    <button onClick={() => handleEdit(acc)}
                      style={{ padding: '8px 12px', borderRadius: '10px', background: '#F8F9FB', border: '1px solid #E4E4E7', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#000' }}
                      className="icon-btn">
                      <Edit2 size={14} /> Edit
                    </button>
                    <button onClick={() => togglePrimary(acc.id)}
                      style={{ padding: '8px', borderRadius: '10px', background: acc.is_primary ? 'var(--accent-primary)' : '#F8F9FB', border: '1px solid #E4E4E7', color: acc.is_primary ? '#FFF' : '#A1A1AA' }}
                      className="icon-btn"
                      title={acc.is_primary ? "Unset Primary" : "Set as Primary"}>
                      <Star size={14} fill={acc.is_primary ? "#FFF" : "none"} />
                    </button>
                  </div>
                  <button onClick={() => handleDelete(acc.id)}
                    style={{ padding: '6px', color: '#EF4444', background: 'none', border: 'none' }}
                    className="trash-btn">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {!loading && accounts.length === 0 && (
        <div style={{ background: '#FFF', border: '2px dashed #E4E4E7', borderRadius: 20, padding: '48px 24px', textAlign: 'center' }}>
          <UserPlus size={40} style={{ color: '#A1A1AA', marginBottom: 12 }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: '#000', marginBottom: 3 }}>No accounts linked</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>Add your family accounts to start automation</div>
          <button onClick={() => setShowForm(true)} style={{ padding: '10px 20px', borderRadius: 10, background: '#000', color: '#FFF', fontWeight: 700, border: 'none', cursor: 'pointer' }} className="btn-premium">Connect First Account</button>
        </div>
      )}
    </div>
  );
}
