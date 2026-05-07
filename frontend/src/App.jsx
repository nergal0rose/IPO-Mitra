import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutGrid, Wallet, CheckCircle, FileText, Settings, LogOut, Key, Calendar, Menu, Zap, BarChart2, TrendingUp, Loader2 } from 'lucide-react';
import { getPin, setPin, clearPin } from './lib/api';
import api from './lib/api';
import { ToastProvider } from './components/Toast';
import Dashboard from './pages/Dashboard';
import Apply from './pages/Apply';
import BulkCheck from './pages/BulkCheck';
import Accounts from './pages/Accounts';
import TimelinePage from './pages/Timeline';

/* ── PIN Lock Screen ── */
function PinLock({ onUnlock }) {
  const [digits, setDigits] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSetup, setIsSetup] = useState(false);
  const [firstPin, setFirstPin] = useState('');

  useEffect(() => {
    api.get('/api/accounts/check-setup').then(res => {
      if (!res.data.has_pin) setIsSetup(true);
    }).catch(() => { });
  }, []);

  const verifyAndUnlock = (pinToVerify) => {
    if (pinToVerify.length !== 4) return;
    setLoading(true);
    
    if (isSetup) {
      if (!firstPin) {
        setFirstPin(pinToVerify);
        setDigits('');
        setLoading(false);
        return;
      }
      if (pinToVerify !== firstPin) {
        setError('PINs do not match');
        setDigits('');
        setFirstPin('');
        setLoading(false);
        return;
      }
      api.post('/api/accounts/set-pin', { pin: pinToVerify })
        .then(() => {
          setPin(pinToVerify);
          onUnlock();
        })
        .catch(() => setError('Setup failed'))
        .finally(() => setLoading(false));
      return;
    }

    api.post('/api/accounts/verify-pin', { pin: pinToVerify })
      .then(() => {
        setPin(pinToVerify);
        onUnlock();
      })
      .catch(() => {
        const witty = [
          "Nope \ud83d\ude43 That code lives in a different timeline.",
          "The lock has seen better guesses. \ud83d\ude0f",
          "Even the server is confused now. \ud83d\ude0f"
        ];
        setError(witty[Math.floor(Math.random() * witty.length)]);
        setDigits('');
      })
      .finally(() => setLoading(false));
  };

  const handleKey = (d) => {
    if (digits.length >= 4) return;
    const next = digits + d;
    setDigits(next);
    if (next.length === 4) verifyAndUnlock(next);
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
      <div className={`text-center p-10 bg-white rounded-[36px] shadow-2xl border border-zinc-100 w-full mx-4 ${error ? 'shake' : ''}`} style={{ maxWidth: '320px', animation: 'fadeIn 0.5s ease-out' }}>
        <div style={{ 
          width: 66, height: 66, background: 'transparent', borderRadius: 18, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          margin: '0 auto 20px'
        }}>
          <img src="/logo.png" style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="IPO Mitra" />
        </div>
        <h2 style={{ fontSize: 23, fontWeight: 800, color: '#000', marginBottom: 6, letterSpacing: '-0.04em' }}>IPO Mitra</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 26, fontWeight: 500 }}>
          {isSetup ? (firstPin ? 'Confirm your new PIN' : 'Set a 4-digit security PIN') : 'Enter your security PIN'}
        </p>
        
        {error && <div style={{ color: '#EF4444', fontSize: 14, fontWeight: 700, marginBottom: 18 }}>{error}</div>}
        
        <div className="flex justify-center gap-4 mb-10">
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{ 
              width: 13, height: 13, borderRadius: '50%', 
              background: i < digits.length ? '#000' : '#E4E4E7',
              transform: i === digits.length ? 'scale(1.2)' : 'scale(1)',
              transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }} />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, '←'].map(d => (
            <button key={d} 
              onClick={() => d === 'C' ? setDigits('') : d === '←' ? setDigits(prev => prev.slice(0,-1)) : handleKey(String(d))}
              disabled={loading}
              style={{
                height: 60, borderRadius: 18, fontSize: 18, fontWeight: 800,
                background: '#F8F9FB', border: '1px solid #F1F1F4', color: '#000',
                transition: 'all 0.1s'
              }}
              className="active:bg-zinc-100 active:scale-95 transition-all"
            >
              {d === '←' ? <TrendingUp size={20} style={{ transform: 'rotate(-90deg)', margin: '0 auto' }} /> : d}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Change PIN Modal ── */
function ChangePinModal({ onClose }) {
  const [current, setCurrent] = useState('');
  const [newPin, setNewPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newPin.length !== 4) { setError('New PIN must be 4 digits'); return; }
    setLoading(true);
    api.post('/api/accounts/change-pin', { old_pin: current, new_pin: newPin })
      .then(() => { setPin(newPin); onClose(); })
      .catch(err => setError(err.response?.data?.detail || 'Update failed'))
      .finally(() => setLoading(false));
  };

  return createPortal(
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, overflowY: 'auto', background: 'rgba(0,0,0,0.75)' }}>
      <div style={{ padding: '32px 16px' }}>
        <div className="page-enter" style={{ background: '#FFF', padding: '48px', borderRadius: '40px', width: '100%', maxWidth: 440, margin: '0 auto', boxShadow: '0 32px 64px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: '#F8F9FB', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#000', border: '1px solid #F1F1F4' }}>
            <Key size={24} />
          </div>
          <h3 style={{ color: '#000', fontSize: '24px', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 8 }}>Security PIN</h3>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: 500 }}>Update your 4-digit access code</p>
        </div>
        
        {error && <div style={{ color: '#EF4444', fontSize: '13px', fontWeight: 700, marginBottom: 24, textAlign: 'center', padding: '12px', background: 'rgba(239,68,68,0.05)', borderRadius: '12px' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', display: 'block' }}>Current PIN</label>
            <input type="password" maxLength={4} value={current} onChange={e => setCurrent(e.target.value)} 
              placeholder="••••"
              style={{ width: '100%', background: '#F8F9FB', border: '1px solid #E4E4E7', borderRadius: '16px', padding: '14px 20px', fontSize: '20px', fontWeight: 800, letterSpacing: '8px', textAlign: 'center', outline: 'none' }} required />
          </div>
          <div style={{ marginBottom: 40 }}>
            <label style={{ fontSize: '12px', fontWeight: 800, color: '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', display: 'block' }}>New 4-Digit PIN</label>
            <input type="password" maxLength={4} value={newPin} onChange={e => setNewPin(e.target.value)} 
              placeholder="••••"
              style={{ width: '100%', background: '#F8F9FB', border: '1px solid #E4E4E7', borderRadius: '16px', padding: '14px 20px', fontSize: '20px', fontWeight: 800, letterSpacing: '8px', textAlign: 'center', outline: 'none' }} required />
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '16px', borderRadius: '18px', fontSize: '15px', fontWeight: 800, color: '#000', border: '1px solid #E4E4E7', background: 'transparent', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ flex: 1, padding: '16px', borderRadius: '18px', fontSize: '15px', fontWeight: 800, color: '#FFF', background: '#000', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {loading ? <Loader2 size={20} className="animate-spin" /> : 'Update PIN'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Sidebar ── */
function NavItem({ to, icon: Icon, label, active, onClick }) {
  return (
    <Link to={to} onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 16px',
        borderRadius: '16px',
        fontSize: '14px',
        fontWeight: active ? '700' : '500',
        color: active ? '#000000' : '#FFFFFF',
        background: active ? '#FFFFFF' : 'transparent',
        textDecoration: 'none',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: active ? 1 : 0.6
      }}
      className={`nav-item-hover ${active ? 'shadow-md' : ''}`}
    >
      <Icon size={20} strokeWidth={active ? 2.5 : 2} />
      {label}
    </Link>
  );
}

function Sidebar({ accounts, onClose, onChangePin }) {
  const location = useLocation();

  return (
    <div className="flex flex-col h-[calc(100vh-32px)]" style={{ 
      width: 210, 
      background: '#111111', 
      borderRadius: '20px',
      padding: '24px 12px',
      margin: '16px',
      boxShadow: '0 16px 32px rgba(0,0,0,0.3)',
      border: '1px solid rgba(255,255,255,0.05)'
    }}>
      <div className="branding-container" style={{ margin: '0 4px 28px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
        <div style={{ 
          width: '36px', height: '36px', background: 'transparent', borderRadius: '10px', 
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <img src="/logo.png" style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Logo" />
        </div>
        <div className="neon-text" style={{ fontWeight: 800, fontSize: '17px', letterSpacing: '-0.03em' }}>
          IPO Mitra
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <NavItem to="/" icon={LayoutGrid} label="Dashboard" active={location.pathname === '/'} onClick={onClose} />
        <NavItem to="/accounts" icon={Wallet} label="Accounts" active={location.pathname === '/accounts'} onClick={onClose} />
        <NavItem to="/apply" icon={Zap} label="Apply" active={location.pathname === '/apply'} onClick={onClose} />
        <NavItem to="/calendar" icon={Calendar} label="Timeline" active={location.pathname === '/calendar'} onClick={onClose} />
        <NavItem to="/bulk-check" icon={BarChart2} label="Reports" active={location.pathname === '/bulk-check'} onClick={onClose} />
        <NavItem to="/settings" icon={Settings} label="Settings" active={location.pathname === '/settings'} onClick={onClose} />
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10, padding: '0 4px' }}>
        <button onClick={onChangePin} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 14,
          background: 'rgba(255,255,255,0.08)', color: '#FFF', border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: 600, transition: 'background 0.2s'
        }} className="hover:bg-[rgba(255,255,255,0.12)]">
          <Key size={16} /> Security PIN
        </button>
        <button onClick={() => { clearPin(); window.location.reload(); }} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 14,
          background: 'transparent', color: '#F87171', border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: 600, transition: 'opacity 0.2s'
        }} className="hover:opacity-80">
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
}

function App() {
  const [unlocked, setUnlocked] = useState(!!getPin());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showChangePin, setShowChangePin] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [unionIpos, setUnionIpos] = useState([]);
  const [appliedCount, setAppliedCount] = useState(0);
  const [fetchingIpos, setFetchingIpos] = useState(false);
  const location = useLocation();

  const fetchGlobalData = () => {
    api.get('/api/accounts/').then(r => setAccounts(r.data)).catch(() => { });
    
    setFetchingIpos(true);
    Promise.all([
      api.get('/api/ipos/applicable'),
      api.get('/api/reports/')
    ]).then(([ipoRes, repRes]) => {
      setUnionIpos(ipoRes.data);
      setAppliedCount(repRes.data.length);
    }).catch((err) => console.error('[fetchGlobalData]', err))
      .finally(() => setFetchingIpos(false));
  };

  useEffect(() => {
    if (!unlocked) return;
    fetchGlobalData();
    const handleUpdate = () => fetchGlobalData();
    window.addEventListener('accounts_updated', handleUpdate);
    return () => window.removeEventListener('accounts_updated', handleUpdate);
  }, [unlocked]);

  if (!unlocked) return <PinLock onUnlock={() => setUnlocked(true)} />;

  return (
    <>
      <ToastProvider>
        {showChangePin && <ChangePinModal onClose={() => setShowChangePin(false)} />}
        <div className="h-screen flex overflow-hidden" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
          {sidebarOpen && (
            <div className="fixed inset-0 z-40 lg:hidden" style={{ background: 'rgba(0,0,0,0.7)' }}
              onClick={() => setSidebarOpen(false)} />
          )}

          <aside className={`fixed inset-y-0 left-0 z-50 lg:relative transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <Sidebar accounts={accounts} onClose={() => setSidebarOpen(false)} onChangePin={() => setShowChangePin(true)} />
          </aside>

          <div className="flex-1 min-w-0 flex flex-col">
            <header className="h-14 flex items-center justify-between px-6 lg:hidden" style={{ background: '#FFF', borderBottom: '1px solid var(--border-subtle)' }}>
              <button onClick={() => setSidebarOpen(true)} style={{ color: 'var(--text-primary)' }}><Menu size={20} /></button>
              <div className="flex items-center">
                <img src="/logo.png" style={{ height: '32px', width: 'auto', objectFit: 'contain' }} alt="IPO Mitra" />
              </div>
              <div style={{ width: 20 }} />
            </header>

            <main className="flex-1 overflow-y-auto" style={{ padding: '32px' }}>
              <div style={{ maxWidth: 1080, margin: '0 auto' }}>
                <Routes>
                  <Route path="/" element={<Dashboard accounts={accounts} ipos={unionIpos} appliedCount={appliedCount} loading={fetchingIpos} />} />
                  <Route path="/accounts" element={<Accounts />} />
                  <Route path="/apply" element={<Apply globalAccounts={accounts} globalIpos={unionIpos} globalFetching={fetchingIpos} />} />
                  <Route path="/bulk-check" element={<BulkCheck />} />
                  <Route path="/calendar" element={<TimelinePage />} />
                  <Route path="/settings" element={<div style={{ padding: 40, textAlign: 'center', color: '#71717A' }}>Settings configuration coming soon.</div>} />
                </Routes>
              </div>
            </main>
          </div>
        </div>
      </ToastProvider>
    </>
  );
}

export default App;
