import { useState, useEffect, useMemo } from 'react';
import api from '../lib/api';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import CountdownTimer, { getClosingUrgency } from '../components/CountdownTimer';
import { useToast } from '../components/Toast';

/* ── Stat Card (from mockup) ── */
function StatCard({ label, value, valueColor, sub }) {
  return (
    <div style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: valueColor }}>{value}</div>
      <div style={{ fontSize: 10, color: '#6B7280', marginTop: 3 }}>{sub}</div>
    </div>
  );
}

/* ── IPO Row Card (from mockup: horizontal, 3px left border) ── */
function IPOCard({ ipo }) {
  const closeDate = ipo.closeDate || ipo.issueEndDateString;
  const urgency = getClosingUrgency(closeDate);
  const borderColor = urgency === 'today' ? '#EF4444' : urgency === 'tomorrow' ? '#F59E0B' : '#374151';
  const price = ipo.sharePrice || 100;

  return (
    <div style={{
      background: '#111827', border: '1px solid #1F2937', borderRadius: 10, padding: '12px 14px',
      display: 'flex', alignItems: 'center', gap: 12, position: 'relative', overflow: 'hidden',
    }}>
      {/* Left color strip */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: borderColor }} />

      {/* Info */}
      <div style={{ flex: 1, paddingLeft: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#F3F4F6', marginBottom: 4 }}>{ipo.companyName}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <StatusBadge label={ipo.shareTypeName || 'IPO'} variant="info" />
          {closeDate && (
            <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: urgency === 'today' ? '#EF4444' : urgency === 'tomorrow' ? '#F59E0B' : '#6B7280' }}>
              ⏱ {urgency === 'today' ? 'Closes today' : <CountdownTimer targetDate={closeDate} />}
            </span>
          )}
        </div>
      </div>

      {/* Right: price + buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: '#F5A623' }}>Rs. {price}</div>
          <div style={{ fontSize: 10, color: '#6B7280' }}>per share · min {ipo.minUnit || 10}</div>
        </div>
        <Link to="/apply" style={{
          padding: '6px 12px', borderRadius: 6, background: '#F5A623', color: '#000', fontSize: 11, fontWeight: 600,
          border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', textDecoration: 'none',
        }}>Apply Now</Link>
        <button style={{
          padding: '6px 10px', borderRadius: 6, background: 'transparent', color: '#4B5563', fontSize: 11,
          border: '1px solid #1F2937', cursor: 'pointer',
        }}>Skip</button>
      </div>
    </div>
  );
}

/* ── Health Card (from mockup) ── */
function HealthCard({ account, status }) {
  const isOk = !status || status.status === 'OK';
  const dotColor = isOk ? '#22C55E' : '#EF4444';

  return (
    <div style={{
      background: '#111827', border: '1px solid #1F2937', borderRadius: 9,
      padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: '#F3F4F6' }}>{account.name}</div>
        <div style={{ fontSize: 10, color: '#6B7280' }}>{account.username}</div>
      </div>
      <div style={{ fontSize: 10, color: isOk ? '#6B7280' : '#EF4444', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace" }}>
        {status ? (isOk ? 'OK' : 'Login fail') : '—'}
      </div>
    </div>
  );
}

/* ── Skeleton ── */
function SkeletonRow() {
  return (
    <div style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ width: '60%', height: 14, borderRadius: 4, marginBottom: 6 }} />
        <div className="skeleton" style={{ width: '40%', height: 10, borderRadius: 4 }} />
      </div>
      <div className="skeleton" style={{ width: 80, height: 28, borderRadius: 6 }} />
    </div>
  );
}

export default function Dashboard({ accounts = [] }) {
  const [openIpos, setOpenIpos] = useState([]);
  const [recentApps, setRecentApps] = useState([]);
  const [healthStatus, setHealthStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const toast = useToast();

  useEffect(() => {
    (async () => {
      try {
        const [openRes, appsRes] = await Promise.allSettled([
          api.get('/api/ipos/open'),
          api.get('/api/reports/')
        ]);
        if (openRes.status === 'fulfilled') setOpenIpos(openRes.value.data);
        if (appsRes.status === 'fulfilled') setRecentApps(appsRes.value.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    Promise.allSettled([api.get('/api/ipos/open'), api.get('/api/reports/')])
      .then(([openRes, appsRes]) => {
        if (openRes.status === 'fulfilled') setOpenIpos(openRes.value.data);
        if (appsRes.status === 'fulfilled') setRecentApps(appsRes.value.data);
        toast.success('Refreshed');
      })
      .finally(() => setLoading(false));
  };

  const handleHealthCheck = () => {
    setCheckingHealth(true);
    api.post('/api/accounts/health-check')
      .then(res => {
        const s = {};
        res.data.forEach(r => { s[r.id] = r; });
        setHealthStatus(s);
        toast.success('Health check done');
      })
      .catch(() => toast.error('Health check failed'))
      .finally(() => setCheckingHealth(false));
  };

  // Stats
  const closingSoon = openIpos.filter(i => { const u = getClosingUrgency(i.closeDate || i.issueEndDateString); return u === 'today' || u === 'tomorrow'; }).length;
  const appliedCount = recentApps.filter(a => a.status === 'APPLIED' || a.status === 'SUCCESS' || a.status === 'BLOCKED').length;
  const pendingCount = recentApps.filter(a => !a.status || a.status === 'PENDING' || a.status === 'APPLIED' || a.status === 'BLOCKED').length;
  const allottedKitta = recentApps.reduce((sum, a) => sum + (a.allotted_kitta || 0), 0);
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#F3F4F6' }}>IPO Dashboard</div>
          <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{dateStr}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={handleRefresh}
            className="btn" style={{ padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 500, background: 'transparent', border: '1px solid #374151', color: '#9CA3AF', cursor: 'pointer' }}>
            ↻ Refresh
          </button>
          <Link to="/apply"
            className="btn" style={{ padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 500, background: '#F5A623', color: '#000', border: 'none', cursor: 'pointer', textDecoration: 'none' }}>
            ⚡ Bulk Apply
          </Link>
        </div>
      </div>

      {/* Stat row — 4 columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        <StatCard label="Open IPOs" value={loading ? '—' : openIpos.length} valueColor="#F5A623" sub={`${closingSoon} closing soon`} />
        <StatCard label="Applied (this cycle)" value={loading ? '—' : appliedCount} valueColor="#22C55E" sub={`${accounts.length} accounts`} />
        <StatCard label="Pending Result" value={loading ? '—' : pendingCount} valueColor="#F59E0B" sub="Allotment pending" />
        <StatCard label="Total Allotted" value={loading ? '—' : allottedKitta} valueColor="#3B82F6" sub="kitta this year" />
      </div>

      {/* Open IPOs section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Open IPOs
          </div>
          <div style={{ fontSize: 11, color: '#6B7280' }}>{openIpos.length} active subscriptions</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading && [1,2,3].map(i => <SkeletonRow key={i} />)}
          {!loading && openIpos.map(ipo => <IPOCard key={ipo.id || ipo.companyShareId} ipo={ipo} />)}
          {!loading && openIpos.length === 0 && (
            <div style={{ background: '#111827', border: '1px dashed #1F2937', borderRadius: 10, padding: '32px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#6B7280' }}>No open IPOs right now. Check back during subscription windows.</div>
            </div>
          )}
        </div>
      </div>

      {/* Account Health section */}
      {accounts.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Account Health
            </div>
            <button onClick={handleHealthCheck} disabled={checkingHealth}
              style={{ fontSize: 11, color: '#F5A623', background: 'none', border: 'none', cursor: 'pointer' }}>
              {checkingHealth ? 'Checking...' : 'Re-check all'}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(accounts.length, 3)}, 1fr)`, gap: 8 }}>
            {accounts.map(acc => (
              <HealthCard key={acc.id} account={acc} status={healthStatus[acc.id]} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
