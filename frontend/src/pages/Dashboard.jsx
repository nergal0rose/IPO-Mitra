import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Sparkles, TrendingUp, ShieldCheck, ChevronRight, Star, Heart, Bell, Loader2, X } from 'lucide-react';
import api from '../lib/api';

function StatCard({ label, value, icon: Icon, color, iconColor }) {
  return (
    <div style={{ 
      background: '#FFF', borderRadius: '16px', padding: '12px 16px', 
      display: 'flex', alignItems: 'center', gap: '16px',
      border: '1px solid #F1F1F4', boxShadow: 'var(--shadow-sm)',
      width: '100%', transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
    }} className="clickable-card">
      <div style={{ 
        width: '32px', height: '32px', borderRadius: '8px', background: color, 
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: iconColor,
        flexShrink: 0
      }}>
        <Icon size={16} strokeWidth={2.5} />
      </div>
      <div>
        <div style={{ fontSize: '18px', fontWeight: 800, color: '#000', lineHeight: 1, marginBottom: '2px' }}>{value}</div>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{label}</div>
      </div>
    </div>
  );
}

function IPOCard({ name, type, price, units }) {
  const navigate = useNavigate();
  return (
    <div style={{ 
      background: '#FFF', borderRadius: '16px', padding: '14px 20px', 
      display: 'flex', alignItems: 'center', gap: '20px',
      border: '1px solid #F1F1F4', boxShadow: 'var(--shadow-sm)',
    }} className="clickable-card">
      <div style={{ 
        width: '40px', height: '40px', borderRadius: '10px', background: '#F8F9FB', 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '14px', fontWeight: 900, color: '#000', border: '1px solid #E4E4E7',
        flexShrink: 0
      }}>
        {name.substring(0, 2).toUpperCase()}
      </div>
      
      <div style={{ flex: 4, minWidth: 0 }}>
        <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#000', letterSpacing: '-0.01em', marginBottom: '2px' }}>{name}</h4>
        <span className="status-info" style={{ fontSize: '9px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px' }}>{type}</span>
      </div>

      <div style={{ flex: 1, textAlign: 'right', paddingRight: '12px', display: 'flex', flexDirection: 'column', minWidth: '80px' }}>
        <div style={{ fontSize: '13px', fontWeight: 800, color: '#000' }}>Rs. {price}</div>
        <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>{units} Units</div>
      </div>

      <button onClick={() => navigate('/apply')} style={{ 
        padding: '8px 16px', borderRadius: '10px', background: '#000', color: '#FFF', 
        border: 'none', fontWeight: 700, fontSize: '12px', cursor: 'pointer',
        flexShrink: 0
      }} className="btn-premium">
        Apply
      </button>
    </div>
  );
}

function HealthCard({ name, active }) {
  return (
    <div style={{ 
      display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 0',
      borderBottom: '1px solid #F9FAFB',
      transition: 'all 0.2s'
    }}>
      <div style={{ 
        width: '42px', height: '42px', borderRadius: '50%', 
        background: active ? 'rgba(16,185,129,0.1)' : '#F3F4F6',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '15px', fontWeight: 800, color: active ? '#047857' : '#9CA3AF',
        textTransform: 'uppercase', flexShrink: 0, position: 'relative'
      }}>
        {name.charAt(0)}
        <div style={{
          position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: '50%',
          background: active ? '#10B981' : '#EF4444', border: '2px solid #FFF',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          {active ? <ShieldCheck size={10} color="#FFF" /> : <X size={10} color="#FFF" />}
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '16px', fontWeight: 700, color: '#000', letterSpacing: '-0.01em' }}>{name}</div>
        <div style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 500 }}>{active ? 'Active' : 'Disabled'} Account</div>
      </div>
      <div className={active ? "status-success" : "status-error"} style={{ 
        fontSize: '11px', fontWeight: 800, padding: '6px 12px', borderRadius: '10px',
        background: active ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.06)'
      }}>
        {active ? 'Healthy' : 'Inactive'}
      </div>
    </div>
  );
}

export default function Dashboard({ accounts, ipos, appliedCount, loading }) {
  const navigate = useNavigate();
  const stats = {
    open: ipos.length,
    applied: appliedCount
  };

    const primaryAccount = accounts.find(a => a.is_primary) || accounts[0];
    const userName = primaryAccount?.name?.split(' ')[0] || 'User';

    return (
      <div className="page-enter" style={{ display: 'flex', gap: '32px' }}>
        {/* Main Content */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Hello Card */}
          <div className="hello-card" style={{ 
            borderRadius: '30px', padding: '12px 24px', position: 'relative', overflow: 'hidden',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: 'var(--shadow-premium)', border: '1px solid rgba(0,0,0,0.02)'
          }}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h1 className="bounce-hover" style={{ 
                fontSize: '28px', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.04em', color: '#000',
                display: 'inline-block', transition: 'all 0.3s'
              }}>
                Hello {userName}!
              </h1>
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#111111', maxWidth: '440px', lineHeight: 1.4, letterSpacing: '-0.01em' }}>
              Welcome ✨ IPO system is live — watching Securities Board of Nepal like it owes us money. Good luck 🍀
            </p>
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ 
                width: '240px', height: '240px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
               <div style={{ width: '240px', height: '240px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <img src="/news_animation.gif" alt="News" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
               </div>
              </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <StatCard label="Current Open IPOs" value={String(stats.open).padStart(2, '0')} icon={LayoutGrid} color="rgba(21, 30, 39, 0.08)" iconColor="#151e27" />
          <StatCard label="Applied History" value={String(stats.applied).padStart(2, '0')} icon={Sparkles} color="rgba(16, 185, 129, 0.08)" iconColor="#059669" />
        </div>

        {/* IPO List Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#000', letterSpacing: '-0.03em' }}>Live Opportunities</h3>
            <button 
              onClick={() => navigate('/apply')}
              style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: '15px', background: 'none', border: 'none', cursor: 'pointer' }}
              className="icon-btn"
            >
              View All
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {loading ? (
              [1, 2].map(i => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 24 }} />)
            ) : ipos.length > 0 ? (
              ipos.map(ipo => (
                <IPOCard key={ipo.id || ipo.companyShareId} name={ipo.companyName} type={ipo.shareTypeName} price={ipo.pricePerShare || 100} units={ipo.minUnit || 10} />
              ))
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', background: '#FFF', borderRadius: 24, border: '1px dashed #E4E4E7', color: 'var(--text-secondary)', fontWeight: 500 }}>
                No active IPOs available right now.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div style={{ width: '260px', display: 'flex', flexDirection: 'column', gap: '40px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginBottom: '-24px' }}>
           <div style={{ width: 48, height: 48, borderRadius: '16px', background: '#FFF', border: '1px solid #F1F1F4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }} className="icon-btn"><Bell size={20} /></div>
           <div style={{ width: 48, height: 48, borderRadius: '16px', background: '#000', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: 16, fontWeight: 800 }} className="icon-btn">{userName.charAt(0).toUpperCase()}</div>
        </div>

        {/* Account Health Section */}
        <div style={{ background: '#FFF', borderRadius: '32px', padding: '32px', boxShadow: 'var(--shadow-lg)', border: '1px solid #F1F1F4' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#000', marginBottom: '24px', letterSpacing: '-0.02em' }}>Account Status</h3>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {accounts.slice(0, 5).map(acc => (
              <HealthCard key={acc.id} name={acc.name} active={acc.active} />
            ))}
            {accounts.length === 0 && <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '20px 0' }}>No accounts linked.</div>}
          </div>
          <button style={{ 
            width: '100%', marginTop: '32px', padding: '16px', borderRadius: '18px',
            background: '#F8F9FB', color: '#000', border: '1px solid #E4E4E7',
            fontWeight: 700, fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
          }} onClick={() => navigate('/accounts')} className="btn-premium">
            Manage Accounts <ChevronRight size={18} />
          </button>
        </div>



        {/* System Notification */}
        <div style={{ 
          background: '#FFF', borderRadius: '28px', padding: '24px', 
          border: '1px solid #F1F1F4', display: 'flex', alignItems: 'center', gap: '20px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
            <ShieldCheck size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#000' }}>System Secure</div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>All protocols running OK</div>
          </div>
        </div>
      </div>
    </div>
  );
}
