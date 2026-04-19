import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Zap, Menu, Lock, LayoutDashboard, Users, Send, BarChart2, TrendingUp, Calendar, Radio } from 'lucide-react';
import { getPin, setPin, clearPin } from './lib/api';
import api from './lib/api';
import { ToastProvider } from './components/Toast';
import Dashboard from './pages/Dashboard';
import Apply from './pages/Apply';
import BulkCheck from './pages/BulkCheck';
import Accounts from './pages/Accounts';

/* ── PIN Lock Screen ── */
function PinLock({ onUnlock }) {
  const [digits, setDigits] = useState('');
  const [error, setError] = useState(false);

  const handleKey = (d) => { if (digits.length >= 8) return; setDigits(prev => prev + d); setError(false); };
  const handleBackspace = () => { setDigits(prev => prev.slice(0, -1)); setError(false); };
  const handleSubmit = () => { if (digits.length < 4) { setError(true); return; } setPin(digits); onUnlock(); };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0B0F1A' }}>
      <div className="text-center max-w-xs w-full px-6">
        <div className="w-[28px] h-[28px] mx-auto mb-4 rounded-[7px] flex items-center justify-center text-sm font-bold" style={{ background: '#F5A623', color: '#000' }}>M</div>
        <div className="text-[13px] font-semibold mb-0.5" style={{ color: '#F3F4F6' }}>MeroShare</div>
        <div className="text-[10px] mb-6" style={{ color: '#6B7280' }}>IPO Manager · Enter PIN</div>
        <div className={`flex justify-center gap-3 mb-6 ${error ? 'shake' : ''}`}>
          {[0,1,2,3].map(i => (
            <div key={i} className="w-3 h-3 rounded-full transition-all duration-150" style={{ background: i < digits.length ? (error ? '#EF4444' : '#F5A623') : '#374151' }} />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[1,2,3,4,5,6,7,8,9].map(d => (
            <button key={d} onClick={() => handleKey(String(d))} className="h-12 rounded-[7px] text-base font-medium active:scale-95 transition-all" style={{ background: '#111827', border: '1px solid #1F2937', color: '#F3F4F6' }}>{d}</button>
          ))}
          <button onClick={handleBackspace} className="h-12 rounded-[7px] text-sm font-medium active:scale-95 transition-all" style={{ background: '#111827', border: '1px solid #1F2937', color: '#9CA3AF' }}>←</button>
          <button onClick={() => handleKey('0')} className="h-12 rounded-[7px] text-base font-medium active:scale-95 transition-all" style={{ background: '#111827', border: '1px solid #1F2937', color: '#F3F4F6' }}>0</button>
          <button onClick={handleSubmit} className="h-12 rounded-[7px] text-xs font-semibold active:scale-95 transition-all" style={{ background: '#F5A623', color: '#000' }}>Go</button>
        </div>
        <div className="text-[10px]" style={{ color: '#4B5563' }}>Decrypts stored credentials</div>
      </div>
    </div>
  );
}

/* ── Sidebar ── */
function NavItem({ to, icon: Icon, label, active, onClick }) {
  return (
    <Link to={to} onClick={onClick}
      className="flex items-center gap-[10px] cursor-pointer"
      style={{
        padding: '9px 10px',
        borderRadius: 8,
        fontSize: '12.5px',
        color: active ? '#F5A623' : '#9CA3AF',
        background: active ? 'rgba(245,166,35,0.1)' : 'transparent',
        borderLeft: active ? '2px solid #F5A623' : '2px solid transparent',
      }}>
      <Icon style={{ width: 15, height: 15, flexShrink: 0 }} />
      {label}
    </Link>
  );
}

function Sidebar({ accounts, onClose }) {
  const location = useLocation();

  return (
    <div className="flex flex-col h-full" style={{ width: 200, background: '#111827', borderRight: '1px solid #1F2937' }}>
      {/* Logo */}
      <div style={{ padding: '4px 16px 20px', display: 'flex', alignItems: 'center', gap: 8, paddingTop: 16 }}>
        <div style={{ width: 28, height: 28, background: '#F5A623', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#000' }}>M</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#F3F4F6', lineHeight: 1.2 }}>MeroShare</div>
          <div style={{ fontSize: 10, color: '#6B7280' }}>IPO Manager</div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ fontSize: 10, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 10px 4px' }}>Main</div>
        <NavItem to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} onClick={onClose} />
        <NavItem to="/accounts" icon={Users} label="Accounts" active={location.pathname === '/accounts'} onClick={onClose} />
        <NavItem to="/apply" icon={Send} label="Apply" active={location.pathname === '/apply'} onClick={onClose} />
        <div style={{ fontSize: 10, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '12px 10px 4px' }}>Analysis</div>
        <NavItem to="/bulk-check" icon={BarChart2} label="Reports" active={location.pathname === '/bulk-check'} onClick={onClose} />
      </div>

      {/* Account badges at bottom */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid #1F2937', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 10, color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 2px 4px' }}>Accounts</div>
        {accounts.map(acc => (
          <div key={acc.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 7, background: '#1C2333' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: acc.active ? '#22C55E' : '#EF4444', flexShrink: 0 }} />
            <div style={{ fontSize: 11, color: '#9CA3AF', flex: 1 }}>{acc.name}</div>
            <div style={{ fontSize: 10, fontWeight: 500, color: acc.active ? '#22C55E' : '#EF4444' }}>●</div>
          </div>
        ))}
        {accounts.length === 0 && <div style={{ fontSize: 10, color: '#4B5563', padding: '4px 10px' }}>No accounts</div>}

        {/* Lock */}
        <button onClick={() => { clearPin(); window.location.reload(); }}
          className="flex items-center gap-2 mt-2" style={{ fontSize: 10, color: '#4B5563', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 10px' }}>
          <Lock style={{ width: 12, height: 12 }} /> Lock App
        </button>
      </div>
    </div>
  );
}

function App() {
  const [unlocked, setUnlocked] = useState(!!getPin());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    if (unlocked) {
      api.get('/api/accounts/').then(r => setAccounts(r.data)).catch(() => {});
    }
  }, [unlocked]);

  if (!unlocked) return <PinLock onUnlock={() => setUnlocked(true)} />;

  return (
    <ToastProvider>
      <div className="min-h-screen flex" style={{ background: '#0B0F1A', color: '#F3F4F6', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13 }}>
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-50 lg:relative transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <Sidebar accounts={accounts} onClose={() => setSidebarOpen(false)} />
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Mobile header */}
          <header className="h-12 flex items-center justify-between px-4 lg:hidden" style={{ background: '#111827', borderBottom: '1px solid #1F2937' }}>
            <button onClick={() => setSidebarOpen(true)} style={{ color: '#9CA3AF' }}><Menu style={{ width: 18, height: 18 }} /></button>
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
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}

export default App;
