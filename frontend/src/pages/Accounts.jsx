import { useState, useEffect } from 'react';
import api from '../lib/api';
import { UserPlus, Trash2, Edit2, Activity, X } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
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
  const toast = useToast();

  const fetchAccounts = () => {
    setLoading(true);
    api.get('/api/accounts/').then(r => setAccounts(r.data)).catch(() => toast.error('Failed to load accounts')).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAccounts();
    api.get('/api/accounts/capitals').then(r => setCapitals(r.data)).catch(() => {});
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
    // Note: window.confirm was bypassed here because browsers will permanently block
    // the delete function if the user accidentally ticks "Prevent from creating dialogs"
    api.delete(`/api/accounts/${id}`)
      .then(() => { 
        fetchAccounts(); 
        window.dispatchEvent(new Event('accounts_updated'));
        toast.success('Deleted'); 
      })
      .catch((err) => {
        toast.error('Failed to delete: ' + (err.response?.data?.detail || err.message));
      });
  };

  const inputStyle = { background: '#1C2333', border: '1px solid #374151', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#F3F4F6', width: '100%', outline: 'none' };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#F3F4F6' }}>Accounts</div>
          <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.8)', marginTop: 2 }}>Manage your MeroShare family accounts</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleHealthCheck} disabled={checkingHealth}
            className="btn" style={{ padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 500, background: 'transparent', border: '1px solid #374151', color: 'rgba(255, 255, 255, 0.8)', cursor: 'pointer' }}>
            <Activity style={{ width: 13, height: 13, display: 'inline', marginRight: 4, verticalAlign: -2 }} className={checkingHealth ? 'animate-spin' : ''} />
            Health Check
          </button>
          <button onClick={() => { setEditing(null); setShowForm(true); }}
            className="btn" style={{ padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 500, background: '#F5A623', color: '#000', border: 'none', cursor: 'pointer' }}>
            + Add Account
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="page-enter" style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 10, padding: '16px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{editing ? 'Edit Account' : 'Add Account'}</div>
            <button onClick={() => setShowForm(false)} style={{ color: 'rgba(255, 255, 255, 0.8)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={16} /></button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { name: 'name', label: 'Account Name', placeholder: 'e.g. Rasmita', defaultValue: editing?.name },
              { name: 'username', label: 'Username', placeholder: 'MeroShare ID', defaultValue: editing?.username },
              { name: 'password', label: 'Password', placeholder: '••••••••', type: 'password', required: !editing },
              { name: 'crn', label: 'CRN Number', placeholder: 'CRN', defaultValue: editing?.crn },
              { name: 'transaction_pin', label: 'Transaction PIN', placeholder: '4 digits', type: 'password', required: !editing },
              { name: 'default_kitta', label: 'Default Kitta', placeholder: '10', type: 'number', defaultValue: editing?.default_kitta || 10 },
            ].map(f => (
              <div key={f.name}>
                <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 5 }}>{f.label}</div>
                <input name={f.name} type={f.type || 'text'} placeholder={f.placeholder} defaultValue={f.defaultValue}
                  required={f.required !== false} style={inputStyle} />
              </div>
            ))}
            <div>
              <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 5 }}>Capital (DP)</div>
              <select name="dp_id" defaultValue={editing?.dp_id} style={inputStyle}>
                {capitals.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <input type="hidden" name="group_label" value="Family" />
            <div className="lg:col-span-3 pt-2 flex gap-2">
              <button type="submit" className="btn" style={{ padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 500, background: '#F5A623', color: '#000', border: 'none', cursor: 'pointer' }}>
                {editing ? 'Update' : 'Save'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn" style={{ padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 500, background: 'transparent', border: '1px solid #374151', color: 'rgba(255, 255, 255, 0.8)', cursor: 'pointer' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Account cards — matching mockup health-card style */}
      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 9, padding: '10px 12px' }}>
              <div className="skeleton" style={{ width: '60%', height: 14, borderRadius: 4, marginBottom: 6 }} />
              <div className="skeleton" style={{ width: '40%', height: 10, borderRadius: 4 }} />
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(accounts.length || 1, 3)}, 1fr)`, gap: 8 }}>
        {accounts.map(acc => {
          const hs = healthStatus[acc.id];
          const isOk = !hs || hs.status === 'OK';
          return (
            <div key={acc.id} className="card" style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 9, padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: acc.active ? (hs ? (isOk ? '#22C55E' : '#EF4444') : '#22C55E') : '#EF4444', flexShrink: 0 }} />
                <div style={{ fontSize: 13, fontWeight: 500, flex: 1, color: '#F3F4F6', opacity: acc.active ? 1 : 0.5 }}>{acc.name}</div>
                <button onClick={() => toggleActive(acc.id)} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, border: `1px solid ${acc.active ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`, color: acc.active ? '#EF4444' : '#22C55E', background: 'transparent', cursor: 'pointer' }}>
                  {acc.active ? 'Disable' : 'Enable'}
                </button>
                {hs && <StatusBadge label={isOk ? 'OK' : 'Fail'} variant={isOk ? 'success' : 'error'} />}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.8)', fontFamily: "'JetBrains Mono', monospace", marginBottom: 3 }}>
                {acc.username}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 8 }}>
                Default: <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{acc.default_kitta}</span> kitta
              </div>
              {hs && !isOk && hs.error && (
                <div style={{ fontSize: 11, color: '#F87171', marginBottom: 8, padding: '6px 8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 6, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  ⚠️ {hs.error}
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1F2937', paddingTop: 8 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => handleSingleCheck(acc.id)} disabled={checkingSingle[acc.id]}
                    style={{ fontSize: 11, color: '#3B82F6', background: 'none', border: 'none', cursor: checkingSingle[acc.id] ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 3, opacity: checkingSingle[acc.id] ? 0.5 : 1 }}>
                    <Activity size={11} className={checkingSingle[acc.id] ? 'animate-spin' : ''} /> Check
                  </button>
                  <button onClick={() => { setEditing(acc); setShowForm(true); }}
                    style={{ fontSize: 11, color: '#F5A623', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Edit2 size={11} /> Edit
                  </button>
                </div>
                <button onClick={() => handleDelete(acc.id)}
                  style={{ color: '#EF4444', opacity: 0.5, background: 'none', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && accounts.length === 0 && (
        <div style={{ background: '#111827', border: '1px dashed #1F2937', borderRadius: 10, padding: '32px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.8)' }}>No accounts yet. Add your MeroShare family accounts to get started.</div>
        </div>
      )}
    </div>
  );
}
