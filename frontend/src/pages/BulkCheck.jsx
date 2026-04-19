import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Search, RefreshCw, BarChart2, FileText } from 'lucide-react';
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
      .then(r => { setResults(r.data); toast.success(`Fetched ${r.data.length} account(s)`); })
      .catch(err => toast.error(err.response?.data?.detail || 'Check failed'))
      .finally(() => setChecking(false));
  };

  const selectStyle = { background: '#1C2333', border: '1px solid #374151', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#F3F4F6', width: '100%', outline: 'none' };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#F3F4F6' }}>Reports</div>
        <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.8)', marginTop: 2 }}>Application status and allotment results</div>
      </div>

      {/* Recent mini cards */}
      <div style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 10, padding: '14px' }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          Recent Applications
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {initLoading && [1,2,3,4,5].map(i => (
            <div key={i} style={{ background: '#1C2333', borderRadius: 8, padding: '10px', border: '1px solid #1F2937' }}>
              <div className="skeleton" style={{ width: '80%', height: 11, borderRadius: 3, marginBottom: 4 }} />
              <div className="skeleton" style={{ width: '50%', height: 9, borderRadius: 3 }} />
            </div>
          ))}
          {!initLoading && history.map((app, i) => (
            <div key={i} style={{ background: '#1C2333', borderRadius: 8, padding: '10px', border: '1px solid #1F2937' }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: '#F3F4F6', marginBottom: 2 }} className="truncate">{app.company_name}</div>
              <div style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 6 }} className="truncate">{app.account_name}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 500, color: 'rgba(255, 255, 255, 0.8)' }}>{app.applied_kitta} Units</span>
                <StatusBadge status={app.status || (app.allotted_kitta > 0 ? 'ALLOTTED' : 'PENDING')} />
              </div>
            </div>
          ))}
          {!initLoading && history.length === 0 && (
            <div className="col-span-full" style={{ textAlign: 'center', padding: '16px', fontSize: 11, color: 'rgba(255, 255, 255, 0.8)' }}>No history yet.</div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 10, padding: '14px' }}
        className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 5 }}>IPO Filter</div>
          <select value={selectedIssue} onChange={e => setSelectedIssue(e.target.value)} style={selectStyle}>
            <option value="ALL">All Recent IPOs</option>
            {issues.map(i => <option key={i.company_share_id} value={i.company_share_id}>{i.company_name}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 5 }}>Account Filter</div>
          <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} style={selectStyle}>
            <option value="ALL">All Accounts</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <button onClick={handleCheck} disabled={checking}
          className="btn" style={{
            padding: '10px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600,
            background: '#F5A623', color: '#000', border: 'none', cursor: 'pointer',
            opacity: checking ? 0.4 : 1,
          }}>
          {checking ? '⏳ Checking...' : '🔍 Fetch Live Status'}
        </button>
      </div>

      {/* Results table */}
      {results && (
        <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Live Results
          </div>
          {results.map((acc, i) => (
            <div key={i} style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 10, overflow: 'hidden' }}>
              {/* Account header */}
              <div style={{ background: '#1C2333', borderBottom: '1px solid #374151', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#F3F4F6' }}>{acc.account_name}</span>
                {!acc.login_ok && <StatusBadge label="Login Error" variant="error" />}
              </div>

              {/* Table header */}
              <div className="hidden sm:grid grid-cols-12 gap-1" style={{ background: '#1C2333', borderBottom: '1px solid #374151', padding: '8px 14px' }}>
                <div className="col-span-5" style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Company</div>
                <div className="col-span-1" style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Scrip</div>
                <div className="col-span-2 text-right" style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Applied</div>
                <div className="col-span-2 text-right" style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Allotted</div>
                <div className="col-span-2 text-right" style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</div>
              </div>

              {/* Data rows */}
              {acc.applications.map((app, j) => (
                <div key={j} className="grid grid-cols-1 sm:grid-cols-12 gap-1 items-center transition-colors"
                  style={{ padding: '10px 14px', borderBottom: '1px solid #1F2937' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1C2333'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div className="sm:col-span-5" style={{ fontSize: 12, color: '#F3F4F6' }}>{app.company_name}</div>
                  <div className="sm:col-span-1" style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.8)', fontFamily: "'JetBrains Mono', monospace" }}>{app.scrip}</div>
                  <div className="sm:col-span-2 sm:text-right" style={{ fontSize: 12, fontWeight: 500, fontFamily: "'JetBrains Mono', monospace", color: '#F3F4F6' }}>{app.applied_kitta}</div>
                  <div className="sm:col-span-2 sm:text-right" style={{ fontSize: 12, fontWeight: 500, fontFamily: "'JetBrains Mono', monospace", color: app.allotted_kitta > 0 ? '#22C55E' : 'rgba(255, 255, 255, 0.8)' }}>
                    {app.allotted_kitta > 0 ? app.allotted_kitta : '—'}
                  </div>
                  <div className="sm:col-span-2 sm:text-right"><StatusBadge status={app.status} /></div>
                </div>
              ))}
              {acc.applications.length === 0 && (
                <div style={{ padding: '24px 14px', textAlign: 'center', fontSize: 11, color: 'rgba(255, 255, 255, 0.8)' }}>No applications found.</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
