import { useState, useEffect } from 'react';
import api from '../lib/api';
import { RefreshCw, CheckCircle, XCircle, Minus, Loader2 } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../components/Toast';

/* Progress row per spec */
function ProgressRow({ result, index }) {
  const isSuccess = result.status === 'SUCCESS';
  const isFailed = result.status === 'FAILED';
  const Icon = isSuccess ? CheckCircle : isFailed ? XCircle : Minus;
  const iconColor = isSuccess ? '#22C55E' : isFailed ? '#EF4444' : 'rgba(255, 255, 255, 0.8)';
  const label = isSuccess ? `Applied — ${result.kitta || 10} kitta` : isFailed ? `Failed: ${result.message || 'Unknown'}` : 'Skipped';

  return (
    <div className="progress-row-enter" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      padding: '10px 14px', borderBottom: '1px solid #1F2937',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255, 255, 255, 0.8)', width: 16, flexShrink: 0 }}>{index + 1}</span>
        <div className="status-swap"><Icon style={{ width: 14, height: 14, color: iconColor }} /></div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#F3F4F6' }} className="truncate">{result.account}</div>
          <div style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.8)' }} className="truncate">{result.company}</div>
        </div>
      </div>
      <StatusBadge status={result.status} />
    </div>
  );
}

export default function Apply() {
  const [accounts, setAccounts] = useState([]);
  const [unionIpos, setUnionIpos] = useState([]);
  const [applying, setApplying] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedIpos, setSelectedIpos] = useState(new Set());
  const [selectedAccounts, setSelectedAccounts] = useState(new Set());
  const toast = useToast();

  const fetchData = async () => {
    setFetching(true);
    try {
      const [accRes, ipoRes] = await Promise.all([api.get('/api/accounts/'), api.get('/api/ipos/applicable')]);
      const active = accRes.data.filter(a => a.active);
      setAccounts(active);
      setUnionIpos(ipoRes.data);
      setSelectedAccounts(new Set(active.map(a => a.id)));
    } catch (err) { toast.error('Failed to fetch'); }
    finally { setFetching(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleApply = () => {
    if (selectedIpos.size === 0 || selectedAccounts.size === 0) { toast.warning('Select at least one IPO and one account.'); return; }
    if (!confirm(`Apply for ${selectedIpos.size} IPO(s) × ${selectedAccounts.size} account(s)?`)) return;
    setApplying(true); setResults([]);
    api.post('/api/apply/bulk', {
      account_ids: Array.from(selectedAccounts),
      ipos: unionIpos.filter(i => selectedIpos.has(i.id || i.companyShareId)),
      dry_run: false
    }).then(res => {
      setResults(res.data);
      const ok = res.data.filter(r => r.status === 'SUCCESS').length;
      toast.success(`Done: ${ok}/${res.data.length} applied`);
    }).catch(err => toast.error(err.response?.data?.detail || err.message)).finally(() => setApplying(false));
  };

  const toggle = (set, setter, id) => { const n = new Set(set); n.has(id) ? n.delete(id) : n.add(id); setter(n); };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#F3F4F6' }}>Apply IPO</div>
          <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.8)', marginTop: 2 }}>Select IPOs and accounts to bulk apply</div>
        </div>
        <button onClick={fetchData} disabled={fetching}
          className="btn" style={{ padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 500, background: 'transparent', border: '1px solid #374151', color: 'rgba(255, 255, 255, 0.8)', cursor: 'pointer' }}>
          ↻ Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* IPO Selector */}
        <div style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 10, padding: '14px' }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Available IPOs
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {fetching && [1,2].map(i => (
              <div key={i} style={{ padding: '10px 12px', border: '1px solid #1F2937', borderRadius: 8 }}>
                <div className="skeleton" style={{ width: '70%', height: 12, borderRadius: 4, marginBottom: 4 }} />
                <div className="skeleton" style={{ width: '40%', height: 10, borderRadius: 4 }} />
              </div>
            ))}
            {!fetching && unionIpos.map(ipo => {
              const id = ipo.id || ipo.companyShareId;
              const active = selectedIpos.has(id);
              return (
                <div key={id} onClick={() => toggle(selectedIpos, setSelectedIpos, id)} style={{
                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer', transition: 'all 150ms',
                  border: active ? '2px solid #F5A623' : '2px solid #1F2937',
                  background: active ? 'rgba(245,166,35,0.06)' : 'transparent',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#F3F4F6' }}>{ipo.companyName}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 2 }}>
                      {ipo.shareTypeName} · min {ipo.minUnit || 10}
                    </div>
                  </div>
                  <div style={{
                    width: 18, height: 18, borderRadius: '50%', border: `2px solid ${active ? '#F5A623' : '#374151'}`,
                    background: active ? '#F5A623' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {active && <CheckCircle size={10} style={{ color: '#000' }} />}
                  </div>
                </div>
              );
            })}
            {!fetching && unionIpos.length === 0 && (
              <div style={{ padding: '24px 12px', textAlign: 'center', fontSize: 11, color: 'rgba(255, 255, 255, 0.8)', border: '1px dashed #1F2937', borderRadius: 8 }}>
                No applicable IPOs found.
              </div>
            )}
          </div>
        </div>

        {/* Account Selector */}
        <div style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 10, padding: '14px' }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Target Accounts
          </div>
          <div className="grid grid-cols-2 gap-2">
            {accounts.map(acc => {
              const active = selectedAccounts.has(acc.id);
              return (
                <div key={acc.id} onClick={() => toggle(selectedAccounts, setSelectedAccounts, acc.id)} style={{
                  padding: '8px 10px', borderRadius: 8, cursor: 'pointer', transition: 'all 150ms',
                  border: active ? '2px solid #22C55E' : '2px solid #1F2937',
                  background: active ? 'rgba(34,197,94,0.06)' : 'transparent',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 600, background: active ? '#22C55E' : '#1C2333', color: active ? '#000' : 'rgba(255, 255, 255, 0.8)',
                  }}>{acc.name.charAt(0)}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#F3F4F6' }}>{acc.name}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.8)', fontFamily: "'JetBrains Mono', monospace" }}>{acc.default_kitta} Units</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Apply bar */}
      <div style={{
        background: '#111827', border: '1px solid #1F2937', borderRadius: 10, padding: '12px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#F3F4F6' }}>Bulk Apply</div>
          <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.8)', marginTop: 2 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{selectedIpos.size}</span> IPO(s) × <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{selectedAccounts.size}</span> acct = <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#F5A623', fontWeight: 600 }}>{selectedIpos.size * selectedAccounts.size}</span> applications
          </div>
        </div>
        <button disabled={applying || selectedIpos.size === 0} onClick={handleApply}
          className="btn" style={{
            padding: '8px 20px', borderRadius: 7, fontSize: 12, fontWeight: 600,
            background: '#F5A623', color: '#000', border: 'none', cursor: 'pointer',
            opacity: applying || selectedIpos.size === 0 ? 0.4 : 1,
          }}>
          {applying ? '⏳ Applying...' : '⚡ Start Apply'}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="page-enter" style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ background: '#1C2333', borderBottom: '1px solid #374151', padding: '10px 14px', fontSize: 11, fontWeight: 500, color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Results
          </div>
          {results.map((r, i) => <ProgressRow key={i} result={r} index={i} />)}
        </div>
      )}
    </div>
  );
}
