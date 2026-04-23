import { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Zap, Menu, Lock, LayoutDashboard, Users, Send, BarChart2, TrendingUp, Calendar, Radio } from 'lucide-react';
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
  const lastErrorMsg = useRef('');

  useEffect(() => {
    api.get('/api/accounts/').then(res => {
      if (res.data.length === 0) setIsSetup(true);
    }).catch(() => {});
  }, []);

  const verifyAndUnlock = (pinToVerify) => {
    if (pinToVerify.length !== 4) {
      setError('PIN must be exactly 4 digits');
      return;
    }
    if (!/^\d{4}$/.test(pinToVerify)) {
      setError('PIN must be digits only');
      return;
    }

    if (isSetup) {
      if (!firstPin) {
        setFirstPin(pinToVerify);
        setDigits('');
        setError('');
        return;
      } else {
        if (pinToVerify !== firstPin) {
          setError('PINs do not match. Try again.');
          setFirstPin('');
          setDigits('');
          return;
        }
      }
    }
    
    setLoading(true);
    api.post('/api/accounts/verify-pin', { pin: pinToVerify })
      .then(() => {
        setPin(pinToVerify);
        onUnlock();
      })
      .catch(err => {
        const msgs = [
          'Nope 🙃 That code lives in a different timeline.',
          'Incorrect PIN 😏 The lock has seen better guesses.',
          'Incorrect PIN 😏 Even the server is confused now.'
        ];
        const available = msgs.filter(m => m !== lastErrorMsg.current);
        const randomMsg = available[Math.floor(Math.random() * available.length)];
        lastErrorMsg.current = randomMsg;
        
        setError('');
        setTimeout(() => setError(randomMsg), 10);
        setDigits('');
        if (isSetup) { setFirstPin(''); }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (loading) return;
      if (e.key >= '0' && e.key <= '9') {
        setDigits(prev => {
          if (prev.length >= 4) {
            setError('');
            setTimeout(() => setError('PIN cannot exceed 4 digits'), 10);
            return prev;
          }
          const next = prev + e.key;
          setError('');
          if (next.length === 4) {
            setTimeout(() => verifyAndUnlock(next), 0);
          }
          return next;
        });
      } else if (e.key === 'Backspace') {
        setDigits(prev => prev.slice(0, -1));
        setError('');
      } else if (e.key === 'Enter') {
        setDigits(prev => {
          if (prev.length === 4) verifyAndUnlock(prev);
          return prev;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, onUnlock, firstPin, isSetup]); // eslint-disable-line

  const handleKey = (d) => {
    if (digits.length >= 4) {
      setError('');
      setTimeout(() => setError('PIN cannot exceed 4 digits'), 10);
      return;
    }
    const next = digits + d;
    setDigits(next);
    setError('');
    if (next.length === 4) {
      setTimeout(() => verifyAndUnlock(next), 0);
    }
  };
  const handleBackspace = () => { setDigits(prev => prev.slice(0, -1)); setError(''); };
  const handleSubmit = () => { verifyAndUnlock(digits); };
  
  const handleForget = () => {
    if (window.confirm("WARNING: This will permanently delete ALL saved accounts and data. Are you absolutely sure?")) {
      api.delete('/api/accounts/wipe').then(() => {
        clearPin();
        window.location.reload();
      }).catch(err => alert("Wipe failed: " + err));
    }
  };

  const instructionText = isSetup ? (firstPin ? "Confirm your new PIN" : "Create a new PIN") : "IPO Manager · Enter PIN";

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B0F1A' }}>
      <div className="text-center max-w-xs w-full px-6">
        <div className="w-[28px] h-[28px] mx-auto mb-4 rounded-[7px] flex items-center justify-center text-sm font-bold" style={{ background: '#F5A623', color: '#000' }}>M</div>
        <div className="text-[13px] font-semibold mb-0.5" style={{ color: '#F3F4F6' }}>MeroShare</div>
        <div className="text-[10px] mb-6" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>{instructionText}</div>
        {error && <div className="text-[11px] mb-3" style={{ color: '#EF4444' }}>{error}</div>}
        <div className={`flex justify-center gap-3 mb-6 ${error ? 'shake' : ''}`}>
          {[0,1,2,3].map(i => (
            <div key={i} className="w-3 h-3 rounded-full transition-all duration-150" style={{ background: i < digits.length ? (error ? '#EF4444' : '#F5A623') : '#374151' }} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[1,2,3,4,5,6,7,8,9].map(d => (
            <button key={d} onClick={() => handleKey(String(d))} className="h-12 rounded-[7px] text-base font-medium active:scale-95 transition-all" style={{ background: '#111827', border: '1px solid #1F2937', color: '#F3F4F6', opacity: loading ? 0.5 : 1 }} disabled={loading}>{d}</button>
          ))}
          <button onClick={handleBackspace} className="h-12 rounded-[7px] text-sm font-medium active:scale-95 transition-all" style={{ background: '#111827', border: '1px solid #1F2937', color: 'rgba(255, 255, 255, 0.8)', opacity: loading ? 0.5 : 1 }} disabled={loading}>←</button>
          <button onClick={() => handleKey('0')} className="h-12 rounded-[7px] text-base font-medium active:scale-95 transition-all" style={{ background: '#111827', border: '1px solid #1F2937', color: '#F3F4F6', opacity: loading ? 0.5 : 1 }} disabled={loading}>0</button>
          <button onClick={handleSubmit} className="h-12 rounded-[7px] text-xs font-semibold active:scale-95 transition-all" style={{ background: '#F5A623', color: '#000', opacity: loading ? 0.5 : 1 }} disabled={loading}>{loading ? '...' : 'Go'}</button>
        </div>
        <div className="text-[10px] flex justify-end px-2" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
          <button onClick={handleForget} style={{ color: '#EF4444', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}>Forget Code?</button>
        </div>
      </div>
    </div>
  );
}

/* ── Sidebar ── */
function ChangePinModal({ onClose }) {
  const [current, setCurrent] = useState('');
  const [newPin, setNewPin] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (current.length !== 4 || !/^\d{4}$/.test(current)) {
      setError('Current PIN must be exactly 4 digits');
      return;
    }
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setError('New PIN must be exactly 4 digits');
      return;
    }
    if (newPin === current) {
      setError('Nice try 😄 That’s the same PIN. Pick a new one!');
      return;
    }
    api.post('/api/accounts/change-pin', { old_pin: current, new_pin: newPin })
       .then(() => {
           setPin(newPin);
           onClose();
           window.alert('Lock Code successfully changed!');
       })
       .catch(err => {
           setError(err.response?.data?.detail || 'Failed to change PIN');
       });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div style={{ background: '#111827', border: '1px solid #1F2937', padding: 24, borderRadius: 12, width: 300 }}>
         <h3 style={{ color: '#F3F4F6', fontSize: 15, fontWeight: 500, marginBottom: 16 }}>Change Lock Code</h3>
         {error && <div style={{ color: '#EF4444', fontSize: 12, marginBottom: 12 }}>{error}</div>}
         <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginBottom: 4, display: 'block' }}>Current PIN</label>
              <input type="password" value={current} onChange={e=>{setCurrent(e.target.value); setError('');}} style={{ width: '100%', background: '#1C2333', border: '1px solid #374151', borderRadius: 6, padding: '8px 12px', color: '#FFF', outline: 'none', fontSize: 14 }} required autoFocus />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginBottom: 4, display: 'block' }}>New PIN</label>
              <input type="password" value={newPin} onChange={e=>{setNewPin(e.target.value); setError('');}} style={{ width: '100%', background: '#1C2333', border: '1px solid #374151', borderRadius: 6, padding: '8px 12px', color: '#FFF', outline: 'none', fontSize: 14 }} required />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
               <button type="button" onClick={onClose} style={{ padding: '6px 12px', borderRadius: 6, fontSize: 12, color: '#F3F4F6', border: '1px solid #374151', background: 'transparent', cursor: 'pointer' }}>Cancel</button>
               <button type="submit" style={{ padding: '6px 12px', borderRadius: 6, fontSize: 12, color: '#000', background: '#F5A623', border: 'none', fontWeight: 500, cursor: 'pointer' }}>Update Code</button>
            </div>
         </form>
      </div>
    </div>
  );
}

function NavItem({ to, icon: Icon, label, active, onClick }) {
  return (
    <Link to={to} onClick={onClick}
      className="flex items-center gap-[10px] cursor-pointer"
      style={{
        padding: '9px 10px',
        borderRadius: 8,
        fontSize: '12.5px',
        color: active ? '#F5A623' : 'rgba(255, 255, 255, 0.8)',
        background: active ? 'rgba(245,166,35,0.1)' : 'transparent',
        borderLeft: active ? '2px solid #F5A623' : '2px solid transparent',
      }}>
      <Icon style={{ width: 15, height: 15, flexShrink: 0 }} />
      {label}
    </Link>
  );
}

function Sidebar({ accounts, onClose, onChangePin }) {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full" style={{ width: 200, background: '#111827', borderRight: '1px solid #1F2937' }}>
      {/* Logo */}
      <div style={{ padding: '4px 16px 20px', display: 'flex', alignItems: 'center', gap: 8, paddingTop: 16 }}>
        <div style={{ width: 28, height: 28, background: '#F5A623', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#000' }}>M</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#F3F4F6', lineHeight: 1.2 }}>MeroShare</div>
          <div style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.8)' }}>IPO Manager</div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 10px 4px' }}>Main</div>
        <NavItem to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} onClick={onClose} />
        <NavItem to="/accounts" icon={Users} label="Accounts" active={location.pathname === '/accounts'} onClick={onClose} />
        <NavItem to="/apply" icon={Send} label="Apply" active={location.pathname === '/apply'} onClick={onClose} />
        <div style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 10px 4px' }}>Analysis</div>
        <NavItem to="/calendar" icon={Calendar} label="Timeline" active={location.pathname === '/calendar'} onClick={onClose} />
        <NavItem to="/bulk-check" icon={BarChart2} label="Reports" active={location.pathname === '/bulk-check'} onClick={onClose} />
      </div>

      {/* Account badges at bottom */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid #1F2937', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 2px 4px' }}>Accounts</div>
        {accounts.map(acc => (
          <div key={acc.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 7, background: '#1C2333' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: acc.active ? '#22C55E' : '#EF4444', flexShrink: 0 }} />
            <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.8)', flex: 1 }}>{acc.name}</div>
            <div style={{ fontSize: 10, fontWeight: 500, color: acc.active ? '#22C55E' : '#EF4444' }}>●</div>
          </div>
        ))}
        {accounts.length === 0 && <div style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.8)', padding: '4px 10px' }}>No accounts</div>}

        {/* Lock */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <button onClick={() => { clearPin(); window.location.reload(); }}
            className="flex items-center gap-2 mt-2" style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.8)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 10px' }}>
            <Lock style={{ width: 12, height: 12 }} /> Lock App
          </button>
          <button onClick={onChangePin}
            className="flex items-center gap-1 mt-2" style={{ fontSize: 10, color: '#F5A623', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 10px' }}>
            Change PIN
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [unlocked, setUnlocked] = useState(!!getPin());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showChangePin, setShowChangePin] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const location = useLocation();

  const fetchAccounts = () => {
    api.get('/api/accounts/').then(r => setAccounts(r.data)).catch(() => {});
  };

  useEffect(() => {
    if (!unlocked) return;
    fetchAccounts();
    const handleUpdate = () => fetchAccounts();
    window.addEventListener('accounts_updated', handleUpdate);
    return () => window.removeEventListener('accounts_updated', handleUpdate);
  }, [unlocked, location.pathname]);

  if (!unlocked) return <PinLock onUnlock={() => setUnlocked(true)} />;

  return (
    <>
      {showChangePin && <ChangePinModal onClose={() => setShowChangePin(false)} />}
      <ToastProvider>
        <div className="min-h-screen flex" style={{ background: '#0B0F1A', color: '#F3F4F6', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13 }}>
          {/* Mobile overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-40 lg:hidden" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
              onClick={() => setSidebarOpen(false)} />
          )}

          {/* Sidebar */}
          <aside className={`fixed inset-y-0 left-0 z-50 lg:relative transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <Sidebar accounts={accounts} onClose={() => setSidebarOpen(false)} onChangePin={() => setShowChangePin(true)} />
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0 flex flex-col">
            {/* Mobile header */}
            <header className="h-12 flex items-center justify-between px-4 lg:hidden" style={{ background: '#111827', borderBottom: '1px solid #1F2937' }}>
              <button onClick={() => setSidebarOpen(true)} style={{ color: 'rgba(255, 255, 255, 0.8)' }}><Menu style={{ width: 18, height: 18 }} /></button>
              <div className="flex items-center gap-2">
                <div style={{ width: 20, height: 20, background: '#F5A623', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#000' }}>M</div>
                <span style={{ fontSize: 12, fontWeight: 600 }}>MeroShare</span>
              </div>
              <div style={{ width: 18 }} />
            </header>

          <main className="flex-1 overflow-y-auto" style={{ padding: '20px 20px' }}>
            <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Routes>
                <Route path="/" element={<Dashboard accounts={accounts} />} />
                <Route path="/accounts" element={<Accounts />} />
                <Route path="/apply" element={<Apply />} />
                <Route path="/bulk-check" element={<BulkCheck />} />
                <Route path="/calendar" element={<TimelinePage />} />
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
