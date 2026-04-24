import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Search, RefreshCw, BarChart2, FileText, ChevronDown, Download, Filter, Zap } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../components/Toast';

export default function BulkCheck() {
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState(null);
  const [history, setHistory] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [issues, setIssues] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('ALL');
  const [selectedIssue, setSelectedIssue] = useState('ALL');
  const [initLoading, setInitLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    Promise.allSettled([
      api.get('/api/accounts/'),
      api.get('/api/bulk-check/issues'),
      api.get('/api/reports/')
    ]).then(([accRes, issRes, histRes]) => {
      if (accRes.status === 'fulfilled') setAccounts(accRes.value.data);
      if (issRes.status === 'fulfilled') setIssues(issRes.value.data);
      if (histRes.status === 'fulfilled') setHistory(histRes.value.data.slice(0, 10));
    }).finally(() => setInitLoading(false));
  }, []);

  const handleCheck = () => {
    setChecking(true);
    const payload = {};
    if (selectedIssue !== 'ALL') payload.company_share_id = parseInt(selectedIssue);
    if (selectedAccount !== 'ALL') payload.account_id = parseInt(selectedAccount);
    api.post('/api/bulk-check/check', payload)
      .then(r => { setResults(r.data); toast.success(`Fetched status for ${r.data.length} account(s)`); })
      .catch(err => toast.error(err.response?.data?.detail || err.message || 'Status check failed'))
      .finally(() => setChecking(false));
  };

  const selectStyle = { 
    background: '#F8F9FB', border: '1px solid #E4E4E7', borderRadius: '16px', 
    padding: '14px 20px', fontSize: '14px', color: '#000', width: '100%', 
    outline: 'none', fontWeight: 700, appearance: 'none', cursor: 'pointer' 
  };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#000', marginBottom: '6px', letterSpacing: '-0.04em' }}>Application Reports</h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: 500 }}>Live application status and allotment insights across your portfolio</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button style={{ 
            padding: '12px 20px', borderRadius: '16px', background: '#FFF', border: '1px solid #E4E4E7', 
            color: '#000', fontWeight: 800, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: 'var(--shadow-sm)'
          }} className="btn-premium">
            <Download size={18} /> Export Data
          </button>
        </div>
      </div>

      {/* History Grid */}
      <div style={{ background: '#FFF', border: '1px solid #F1F1F4', borderRadius: '40px', padding: '40px', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(79, 70, 229, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={22} color="var(--accent-primary)" />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#000' }}>Recent Activity</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {initLoading ? (
            [1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: '110px', borderRadius: '24px' }} />)
          ) : (
            history.map((app, i) => (
              <div key={i} style={{ background: '#F8F9FB', borderRadius: '24px', padding: '20px', border: '1px solid #F1F1F4', display: 'flex', flexDirection: 'column', gap: '12px' }} className="clickable-card">
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#000' }} className="truncate">{app.company_name}</div>
                  <div style={{ fontSize: '12px', color: '#71717A', fontWeight: 600 }} className="truncate">{app.account_name}</div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                  <span style={{ fontSize: '12px', fontWeight: 900, color: '#000' }}>{app.applied_kitta} Units</span>
                  <StatusBadge status={app.status || (app.allotted_kitta > 0 ? 'ALLOTTED' : 'PENDING')} />
                </div>
              </div>
            ))
          )}
          {!initLoading && history.length === 0 && <div className="col-span-full py-16 text-center text-sm font-medium text-zinc-400">No application records found.</div>}
        </div>
      </div>

      {/* Control Panel */}
      <div style={{ background: '#FFF', border: '1px solid #F1F1F4', borderRadius: '40px', padding: '40px', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={22} color="#059669" fill="currentColor" />
          </div>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#000' }}>Live Verification</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div style={{ position: 'relative' }}>
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', display: 'block' }}>Select Company</label>
            <select value={selectedIssue} onChange={e => setSelectedIssue(e.target.value)} style={selectStyle}>
              <option value="ALL">All Active Issues</option>
              {issues.map(i => <option key={i.company_share_id} value={i.company_share_id}>{i.company_name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', display: 'block' }}>Target Account</label>
            <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} style={selectStyle}>
              <option value="ALL">Entire Portfolio</option>
              {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button onClick={handleCheck} disabled={checking}
              style={{
                width: '100%', padding: '14px', borderRadius: '16px', fontSize: '15px', fontWeight: 800,
                background: '#000', color: '#FFF', border: 'none', cursor: 'pointer',
                opacity: checking ? 0.6 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
              }} className="btn-premium">
              {checking ? <RefreshCw size={20} className="animate-spin" /> : <Search size={20} strokeWidth={2.5} />}
              {checking ? 'Verifying...' : 'Check Status'}
            </button>
          </div>
        </div>
      </div>

      {/* Results Rendering */}
      {results && (
        <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {results.map((acc, i) => (
            <div key={i} style={{ background: '#FFF', border: '1px solid #F1F1F4', borderRadius: '32px', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
              <div style={{ background: '#F8F9FB', borderBottom: '1px solid #F1F1F4', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#000' }}>{acc.account_name}</h3>
                {!acc.login_ok && <StatusBadge label="Auth Error" variant="error" />}
              </div>

              <div style={{ padding: '0 32px' }}>
                <div className="hidden sm:grid grid-cols-12 gap-4 py-6 border-bottom-dashed" style={{ borderBottom: '1px dashed #E4E4E7' }}>
                  <div className="col-span-6" style={{ fontSize: '11px', fontWeight: 800, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Issue Details</div>
                  <div className="col-span-2 text-right" style={{ fontSize: '11px', fontWeight: 800, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Applied</div>
                  <div className="col-span-2 text-right" style={{ fontSize: '11px', fontWeight: 800, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Allotted</div>
                  <div className="col-span-2 text-right" style={{ fontSize: '11px', fontWeight: 800, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Live Status</div>
                </div>

                {acc.applications.map((app, j) => (
                  <div key={j} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center py-6" style={{ borderBottom: j === acc.applications.length - 1 ? 'none' : '1px solid #F9FAFB' }}>
                    <div className="sm:col-span-6">
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#000' }}>{app.company_name}</div>
                      <div style={{ fontSize: '12px', color: '#A1A1AA', fontWeight: 600, marginTop: '2px' }}>{app.scrip}</div>
                    </div>
                    <div className="sm:col-span-2 sm:text-right" style={{ fontSize: '15px', fontWeight: 800, color: '#000' }}>{app.applied_kitta}</div>
                    <div className="sm:col-span-2 sm:text-right" style={{ fontSize: '18px', fontWeight: 900, color: app.allotted_kitta > 0 ? '#10B981' : '#A1A1AA' }}>
                      {app.allotted_kitta > 0 ? app.allotted_kitta : '0'}
                    </div>
                    <div className="sm:col-span-2 sm:text-right">
                      <StatusBadge status={app.status} />
                    </div>
                  </div>
                ))}
                
                {acc.applications.length === 0 && (
                  <div style={{ padding: '64px 0', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', color: '#A1A1AA', fontWeight: 600 }}>No active application records for this query.</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
