import { useState, useEffect } from 'react';
import api from '../lib/api';
import { RefreshCw, CheckCircle, XCircle, Minus, Loader2, Sparkles, Send, Users, ShieldCheck } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { useToast } from '../components/Toast';

function ProgressRow({ result, index }) {
  const isSuccess = result.status === 'SUCCESS';
  const isFailed = result.status === 'FAILED';
  const Icon = isSuccess ? CheckCircle : isFailed ? XCircle : Minus;
  const iconColor = isSuccess ? '#10B981' : isFailed ? '#EF4444' : '#A1A1AA';
  
  return (
    <div className="progress-row-enter" style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
      padding: '20px 32px', borderBottom: '1px solid #F8F9FB',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: '13px', fontWeight: 800, color: '#A1A1AA', width: '24px' }}>{String(index + 1).padStart(2, '0')}</span>
        <div style={{ 
          width: '40px', height: '40px', borderRadius: '12px', background: isSuccess ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon style={{ width: '20px', height: '20px', color: iconColor }} strokeWidth={2.5} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#000' }} className="truncate">{result.account}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }} className="truncate">{result.company}</div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <StatusBadge status={result.status} />
        {isSuccess && <div style={{ fontSize: '12px', fontWeight: 800, color: '#10B981', marginTop: '4px' }}>{result.kitta || 10} Units</div>}
      </div>
    </div>
  );
}

export default function Apply({ globalAccounts, globalIpos, globalFetching }) {
  const [applying, setApplying] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedIpos, setSelectedIpos] = useState(new Set());
  const [selectedAccounts, setSelectedAccounts] = useState(new Set());
  const toast = useToast();

  useEffect(() => {
    if (globalAccounts.length > 0 && selectedAccounts.size === 0) {
      setSelectedAccounts(new Set(globalAccounts.filter(a => a.active).map(a => a.id)));
    }
  }, [globalAccounts]);

  const fetchData = () => {
    // In global mode, we trigger the App's event to refresh if needed,
    // or just rely on the globalFetching state.
    window.dispatchEvent(new CustomEvent('accounts_updated'));
  };

  const handleApply = () => {
    if (selectedIpos.size === 0 || selectedAccounts.size === 0) { toast.warning('Select at least one IPO and one account.'); return; }
    if (!confirm(`Apply for ${selectedIpos.size} IPO(s) × ${selectedAccounts.size} account(s)?`)) return;
    setApplying(true); setResults([]);
    api.post('/api/apply/bulk', {
      account_ids: Array.from(selectedAccounts),
      ipos: globalIpos.filter(i => selectedIpos.has(i.id || i.companyShareId)),
      dry_run: false
    }).then(res => {
      setResults(res.data);
      const ok = res.data.filter(r => r.status === 'SUCCESS').length;
      toast.success(`Done: ${ok}/${res.data.length} applied`);
    }).catch(err => toast.error(err.response?.data?.detail || err.message)).finally(() => setApplying(false));
  };

  const toggle = (set, setter, id) => { const n = new Set(set); n.has(id) ? n.delete(id) : n.add(id); setter(n); };

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#000', marginBottom: '6px', letterSpacing: '-0.04em' }}>Bulk Application</h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: 500 }}>Select open issues and target accounts for automated processing</p>
        </div>
        <button onClick={fetchData} disabled={globalFetching}
          style={{ 
            padding: '12px 20px', borderRadius: '16px', fontSize: '14px', fontWeight: 700, 
            background: '#FFF', border: '1px solid #E4E4E7', color: '#000', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '10px', boxShadow: 'var(--shadow-sm)'
          }} className="btn-premium">
          <RefreshCw size={18} className={globalFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* IPO Selector */}
        <div style={{ background: '#FFF', border: '1px solid #F1F1F4', borderRadius: '24px', padding: '24px', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(79, 70, 229, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={18} color="var(--accent-primary)" />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#000' }}>Available Issues</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {globalFetching && [1,2].map(i => <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '24px' }} />)}
            {!globalFetching && globalIpos.map(ipo => {
              const id = ipo.id || ipo.companyShareId;
              const active = selectedIpos.has(id);
              return (
                <div key={id} onClick={() => toggle(selectedIpos, setSelectedIpos, id)} style={{
                  padding: '16px 20px', borderRadius: '24px', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  border: active ? '1.5px solid #111111' : '1px solid #F1F1F4',
                  background: active ? '#F9FAFB' : '#FFF',
                  display: 'flex', gap: '20px', alignItems: 'center',
                  boxShadow: active ? '0 10px 20px rgba(0,0,0,0.06)' : 'var(--shadow-sm)'
                }} className="clickable-card">
                  <div style={{ 
                    width: '42px', height: '42px', borderRadius: '12px', background: '#F8F9FB', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '15px', fontWeight: 900, color: '#000', border: '1px solid #E4E4E7',
                    flexShrink: 0
                  }}>
                    {ipo.companyName.substring(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#000', letterSpacing: '-0.02em' }} className="truncate">{ipo.companyName}</div>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
                      <span className="status-info" style={{ fontSize: '10px', fontWeight: 800, padding: '2px 10px', borderRadius: '6px' }}>{ipo.shareTypeName}</span>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>{ipo.minUnit || 10} Units Min</div>
                    </div>
                  </div>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%', border: `2px solid ${active ? '#000' : '#E4E4E7'}`,
                    background: active ? '#000' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s', flexShrink: 0
                  }}>
                    {active && <CheckCircle size={14} style={{ color: '#FFF' }} strokeWidth={3} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Account Selector */}
        <div style={{ background: '#FFF', border: '1px solid #F1F1F4', borderRadius: '32px', padding: '32px', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} color="#059669" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#000', letterSpacing: '-0.02em' }}>Active Accounts</h3>
          </div>
          <div className="flex flex-col gap-3">
            {globalFetching && [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '20px' }} />)}
            {!globalFetching && globalAccounts.map(acc => {
              const active = selectedAccounts.has(acc.id);
              return (
                <div key={acc.id} onClick={() => toggle(selectedAccounts, setSelectedAccounts, acc.id)} style={{
                  padding: '16px 20px', borderRadius: '20px', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  background: active ? 'rgba(16,185,129,0.02)' : '#FFF',
                  display: 'flex', alignItems: 'center', gap: '20px',
                  border: '1px solid',
                  borderColor: active ? '#10B981' : '#F1F1F4',
                  boxShadow: active ? '0 10px 30px rgba(16,185,129,0.06)' : 'var(--shadow-sm)'
                }} className="clickable-card">
                  <div style={{ 
                    width: '46px', height: '46px', borderRadius: '50%', 
                    background: active ? 'rgba(16,185,129,0.1)' : '#F8F9FB',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', fontWeight: 800, color: active ? '#047857' : '#9CA3AF',
                    textTransform: 'uppercase', flexShrink: 0, position: 'relative',
                    transition: 'all 0.3s'
                  }}>
                    {acc.name.charAt(0)}
                    <div style={{
                      position: 'absolute', bottom: -2, right: -2, width: 18, height: 18, borderRadius: '50%',
                      background: active ? '#10B981' : '#E4E4E7', border: '2.5px solid #FFF',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s'
                    }}>
                      <ShieldCheck size={11} color="#FFF" />
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#000', letterSpacing: '-0.02em' }}>{acc.name}</div>
                    <div style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: 500 }}>{active ? 'Selected' : 'Active'} Account · {acc.default_kitta} Units</div>
                  </div>
                  <div className={active ? "status-success" : "status-info"} style={{ 
                    fontSize: '11px', fontWeight: 800, padding: '6px 14px', borderRadius: '10px',
                    background: active ? 'rgba(16,185,129,0.1)' : '#F3F4F6',
                    color: active ? '#059669' : '#71717A',
                    transition: 'all 0.3s'
                  }}>
                    {active ? 'Active' : 'Standby'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div style={{
        background: '#111111', borderRadius: '28px', padding: '24px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#FFF', letterSpacing: '-0.02em' }}>Ready to Process</h2>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, marginTop: '2px' }}>
            {selectedIpos.size} IPO(s) across {selectedAccounts.size} verified accounts
          </p>
        </div>
        <button disabled={applying || selectedIpos.size === 0} onClick={handleApply}
          style={{
            padding: '14px 32px', borderRadius: '18px', fontSize: '14px', fontWeight: 800,
            background: '#FFF', color: '#000', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '10px',
            opacity: applying || selectedIpos.size === 0 ? 0.4 : 1
          }} className="btn-premium shadow-xl">
          {applying ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} strokeWidth={2.5} />}
          {applying ? 'Processing...' : 'Apply Now'}
        </button>
      </div>

      {/* Results Section */}
      {results.length > 0 && (
        <div className="page-enter" style={{ background: '#FFF', border: '1px solid #F1F1F4', borderRadius: '32px', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ background: '#F9FAFB', borderBottom: '1px solid #F1F1F4', padding: '24px 32px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 900, color: '#000', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Execution History</h3>
          </div>
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {results.map((r, i) => <ProgressRow key={i} result={r} index={i} />)}
          </div>
        </div>
      )}
    </div>
  );
}
