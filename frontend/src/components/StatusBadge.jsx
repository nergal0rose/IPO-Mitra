/**
 * StatusBadge — Design spec: Badge / Status Pill
 * border-radius: 99px, padding: 2px 8px, DM Sans 500 11px uppercase tracking-wide
 */
const variants = {
  success:  'bg-[rgba(34,197,94,0.12)] text-[var(--status-success)] border-[rgba(34,197,94,0.2)]',
  warning:  'bg-[rgba(245,158,11,0.12)] text-[var(--status-warning)] border-[rgba(245,158,11,0.2)]',
  error:    'bg-[rgba(239,68,68,0.12)] text-[var(--status-error)] border-[rgba(239,68,68,0.2)]',
  info:     'bg-[rgba(59,130,246,0.12)] text-[#3B82F6] border-[rgba(59,130,246,0.2)]',
  neutral:  'bg-[rgba(107,114,128,0.12)] text-[#6B7280] border-[rgba(107,114,128,0.2)]',
  accent:   'bg-[rgba(245,166,35,0.12)] text-[var(--accent-primary)] border-[rgba(245,166,35,0.2)]',
};

const statusMap = {
  ALLOTTED:        { variant: 'success',  label: 'Allotted' },
  NOT_ALLOTTED:    { variant: 'error',    label: 'Not Allotted' },
  PENDING:         { variant: 'warning',  label: 'Pending' },
  FAILED:          { variant: 'error',    label: 'Failed' },
  SUCCESS:         { variant: 'success',  label: 'Applied' },
  ALREADY_APPLIED: { variant: 'warning',  label: 'Already Applied' },
  DRY_RUN:         { variant: 'info',     label: 'Dry Run' },
  SKIPPED:         { variant: 'neutral',  label: 'Skipped' },
  // Native MeroShare statuses mapped to user-friendly terms
  APPROVED:        { variant: 'success',  label: 'Applied' },
  VERIFIED:        { variant: 'success',  label: 'Applied' },
  UNVERIFIED:      { variant: 'warning',  label: 'Pending' },
  REJECTED:        { variant: 'error',    label: 'Failed' },
};

export default function StatusBadge({ status, label, variant }) {
  const mapped = statusMap[status] || {};
  const v = variant || mapped.variant || 'neutral';
  const displayLabel = label || mapped.label || status || '—';
  const cls = variants[v] || variants.neutral;

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-[2px] text-[11px] font-medium uppercase tracking-wide border status-swap ${cls}`}>
      {displayLabel}
    </span>
  );
}
