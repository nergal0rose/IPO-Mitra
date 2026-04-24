import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Calendar as CalendarIcon, Loader2, Sparkles, AlertCircle, Building2, MapPin, ChevronRight, Filter } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

export default function Timeline() {
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeFilter, setActiveFilter] = useState('IPO');
  const [showCount, setShowCount] = useState(20);

  useEffect(() => {
    setLoading(true);
    setError(false);
    api.get('/api/ipos/calendar')
      .then(res => setUpcoming(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const categories = Array.from(new Set(upcoming.map(i => i.shareType || 'IPO')))
    .sort((a, b) => a === 'IPO' ? -1 : b === 'IPO' ? 1 : 0);

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#000', marginBottom: '6px', letterSpacing: '-0.04em' }}>Market Pipeline</h1>
          <p style={{ fontSize: '15px', color: 'var(--text-secondary)', fontWeight: 500 }}>SEBON approved issues and upcoming market entries</p>
        </div>
        <div style={{ 
          width: '64px', height: '64px', borderRadius: '20px', background: '#111111', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF',
          boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
        }}>
          <CalendarIcon size={32} strokeWidth={2.5} />
        </div>
      </div>

      {/* Info Card */}
      <div style={{ 
        background: 'rgba(79, 70, 229, 0.04)', border: '1px solid rgba(79, 70, 229, 0.08)', 
        borderRadius: '24px', padding: '24px 32px', display: 'flex', alignItems: 'center', gap: '20px' 
      }}>
        <div style={{ 
          width: '40px', height: '40px', borderRadius: '12px', background: 'var(--accent-primary)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', flexShrink: 0 
        }}>
          <Sparkles size={20} fill="currentColor" />
        </div>
        <div style={{ fontSize: '14px', color: 'var(--accent-primary)', lineHeight: 1.6, fontWeight: 600 }}>
          Aggregation of SEBON-approved pipelines. These issues typically appear in MeroShare on their official opening day.
        </div>
      </div>

      {/* Filters Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              style={{
                padding: '12px 24px',
                borderRadius: '16px',
                fontSize: '14px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                background: activeFilter === cat ? '#000' : '#FFF',
                color: activeFilter === cat ? '#FFF' : '#71717A',
                border: activeFilter === cat ? '1px solid #000' : '1px solid #E4E4E7',
                cursor: 'pointer',
                boxShadow: activeFilter === cat ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
              }}
              className="btn-premium"
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#FFF', border: '1px solid #E4E4E7', borderRadius: '14px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Filter size={16} color="#A1A1AA" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#71717A' }}>Show:</span>
            <select 
              value={showCount ?? 'All'} 
              onChange={(e) => setShowCount(e.target.value === 'All' ? null : Number(e.target.value))}
              style={{ 
                background: 'transparent', border: 'none', color: '#000', 
                outline: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '13px'
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value="All">All</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div style={{ background: '#FFF', border: '1px solid #FEE2E2', borderRadius: '24px', padding: '32px', textAlign: 'center' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#DC2626', marginBottom: '6px' }}>Failed to load pipeline data</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Could not reach the server. Please try refreshing the page.</div>
        </div>
      )}

      {/* Main List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {loading ? (
          [1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: '140px', borderRadius: '32px' }} />)
        ) : (
          upcoming
            .filter(ipo => (ipo.shareType || 'IPO') === activeFilter)
            .slice(0, showCount === null ? undefined : showCount)
            .map((ipo, i) => (
            <div key={ipo.id || ipo.companyName || i} style={{ 
              background: '#FFF', border: '1px solid #F1F1F4', borderRadius: '32px', padding: '32px', 
              display: 'flex', gap: '32px', transition: 'all 0.2s', boxShadow: 'var(--shadow-md)',
              alignItems: 'center'
            }} className="clickable-card">
              <div style={{ 
                flexShrink: 0, width: '80px', height: '80px', borderRadius: '24px', background: '#F8F9FB', 
                color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontSize: '18px', fontWeight: 900, border: '1px solid #F1F1F4'
              }}>
                {ipo.symbol ? ipo.symbol.substring(0,6) : ipo.companyName.substring(0,3).toUpperCase()}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#000', marginBottom: '6px', letterSpacing: '-0.02em' }}>{ipo.companyName}</h3>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <span className="status-info" style={{ fontSize: '11px', fontWeight: 800, padding: '4px 12px', borderRadius: '8px' }}>{ipo.shareType || 'IPO'}</span>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Building2 size={14} /> {ipo.issueManager || 'N/A'}
                      </div>
                    </div>
                  </div>
                  {ipo.sebonApprovalDate && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '11px', color: '#A1A1AA', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Approval Date</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: '#000' }}>{ipo.sebonApprovalDate}</div>
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '48px', paddingTop: '20px', borderTop: '1px solid #F9FAFB' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#A1A1AA', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Volume</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#000' }}>
                      {ipo.totalUnits ? parseFloat(ipo.totalUnits).toLocaleString() : 'N/A'} <span style={{ fontSize: '12px', color: '#A1A1AA', fontWeight: 600 }}>Units</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: '#A1A1AA', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Value</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#10B981' }}>
                      {ipo.amount ? `Rs. ${parseFloat(ipo.amount).toLocaleString()}` : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ color: '#E4E4E7' }}>
                <ChevronRight size={32} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
