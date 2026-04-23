import { useState, useEffect } from 'react';
import api from '../lib/api';
import { Calendar as CalendarIcon, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';

function UpcomingSkeleton() {
  return (
    <div style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: 10, padding: '16px', display: 'flex', gap: 16 }}>
      <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="skeleton" style={{ width: '40%', height: 16, borderRadius: 4 }} />
        <div className="skeleton" style={{ width: '70%', height: 12, borderRadius: 4 }} />
        <div className="skeleton" style={{ width: '30%', height: 12, borderRadius: 4 }} />
      </div>
    </div>
  );
}

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
      .then(res => {
        // Sort by SEBON approval date descending, or keep native order
        setUpcoming(res.data);
      })
      .catch(err => {
        console.error(err);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#F3F4F6' }}>IPO Timeline</div>
          <div style={{ fontSize: 11, color: 'rgba(255, 255, 255, 0.8)', marginTop: 2 }}>Upcoming approvals and pipelines</div>
        </div>
        <CalendarIcon style={{ color: '#F5A623' }} size={20} />
      </div>

      <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 8, padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <Sparkles style={{ color: '#3B82F6', marginTop: 2, flexShrink: 0 }} size={16} />
        <div style={{ fontSize: 11, color: '#F3F4F6', lineHeight: 1.5 }}>
          This data securely aggregates SEBON-approved IPO pipelines. MeroShare internally hides these until their exact application opening day.
        </div>
      </div>

      {!loading && !error && upcoming.length > 0 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
          {Array.from(new Set(upcoming.map(i => i.shareType || 'IPO'))).sort((a, b) => a === 'IPO' ? -1 : b === 'IPO' ? 1 : 0).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                background: activeFilter === cat ? 'rgba(245, 166, 35, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                color: activeFilter === cat ? '#F5A623' : 'rgba(255, 255, 255, 0.7)',
                border: `1px solid ${activeFilter === cat ? 'rgba(245, 166, 35, 0.4)' : 'transparent'}`,
                cursor: 'pointer'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Show entries control */}
      {!loading && !error && upcoming.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'rgba(255, 255, 255, 0.7)' }}>
          <span>Show</span>
          <select 
            value={showCount} 
            onChange={(e) => setShowCount(e.target.value === 'All' ? 'All' : Number(e.target.value))}
            style={{ 
              background: '#1F2937', 
              border: '1px solid #374151', 
              color: '#F3F4F6', 
              borderRadius: 6, 
              padding: '4px 8px',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value="All">All</option>
          </select>
          <span>entries</span>
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3,4].map(i => <UpcomingSkeleton key={i} />)}
        </div>
      )}

      {error && !loading && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 8, padding: '16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertCircle style={{ color: '#EF4444' }} size={24} />
          <div style={{ fontSize: 12, color: '#F3F4F6' }}>Failed to fetch the timeline. The downstream data source might be temporarily unavailable.</div>
        </div>
      )}

      {!loading && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {upcoming.filter(ipo => (ipo.shareType || 'IPO') === activeFilter).length === 0 ? (
             <div style={{ textAlign: 'center', padding: '40px 20px', color: 'rgba(255, 255, 255, 0.8)', fontSize: 12, border: '1px dashed #1F2937', borderRadius: 8 }}>
               {upcoming.length === 0 ? "No upcoming issues in the pipeline right now." : `No upcoming issues found for category: ${activeFilter}`}
             </div>
          ) : (
            upcoming
              .filter(ipo => (ipo.shareType || 'IPO') === activeFilter)
              .slice(0, showCount === 'All' ? undefined : showCount)
              .map((ipo, i) => (
              <div key={i} style={{ 
                background: '#111827', border: '1px solid #1F2937', borderRadius: 10, padding: '16px', display: 'flex', gap: 16, transition: 'transform 0.2s, borderColor 0.2s', position: 'relative'
              }}>
                <div style={{ 
                  flexShrink: 0, width: 48, height: 48, borderRadius: 10, background: '#1F2937', color: '#F5A623', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 'bold' 
                }}>
                  {ipo.symbol ? ipo.symbol.substring(0,6) : ipo.companyName.substring(0,3).toUpperCase()}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: '#F3F4F6', marginBottom: 4 }}>{ipo.companyName}</div>
                      <StatusBadge label={ipo.shareType || 'IPO'} variant="info" />
                    </div>
                    {ipo.sebonApprovalDate && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SEBON Date</div>
                        <div style={{ fontSize: 12, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: '#F3F4F6' }}>{ipo.sebonApprovalDate}</div>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', gap: 24, paddingTop: 12, borderTop: '1px dashed #1F2937', marginTop: 12 }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 2 }}>Volume (Units)</div>
                      <div style={{ fontSize: 12, fontWeight: 500, fontFamily: "'JetBrains Mono', monospace", color: '#F3F4F6' }}>
                        {ipo.totalUnits ? parseFloat(ipo.totalUnits).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 2 }}>Gross Amount</div>
                      <div style={{ fontSize: 12, fontWeight: 500, fontFamily: "'JetBrains Mono', monospace", color: '#22C55E' }}>
                        {ipo.amount ? `Rs. ${parseFloat(ipo.amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : 'N/A'}
                      </div>
                    </div>
                    <div style={{ flex: 1, paddingLeft: 12, borderLeft: '1px solid #1F2937' }}>
                      <div style={{ fontSize: 10, color: 'rgba(255, 255, 255, 0.8)', marginBottom: 2 }}>Issue Manager</div>
                      <div style={{ fontSize: 11, color: '#F3F4F6' }}>{ipo.issueManager || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
