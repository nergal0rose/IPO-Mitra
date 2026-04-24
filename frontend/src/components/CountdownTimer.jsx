import { useState, useEffect } from 'react';

/**
 * CountdownTimer — shows time remaining until a date.
 * Uses JetBrains Mono. Warning color if <24h. Urgent pulse if closing today.
 */
export default function CountdownTimer({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(targetDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(targetDate));
    }, 60000); // update every minute
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!targetDate) return null;

  const { days, hours, minutes, expired, isToday, isTomorrow } = timeLeft;

  if (expired) {
    return <span className="font-mono text-xs text-[#6B7280]">Closed</span>;
  }

  const urgentClass = isToday ? 'text-[var(--status-error)] countdown-urgent' : isTomorrow ? 'text-[var(--status-warning)]' : 'text-[var(--text-secondary)]';

  return (
    <span className={`font-mono text-xs font-medium ${urgentClass}`}>
      {days > 0 ? `${days}d ${hours}h` : `${hours}h ${minutes}m`}
    </span>
  );
}

function getTimeLeft(dateStr) {
  if (!dateStr) return { days: 0, hours: 0, minutes: 0, expired: true, isToday: false, isTomorrow: false };

  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return { days: 0, hours: 0, minutes: 0, expired: true, isToday: false, isTomorrow: false };

  const now = new Date();
  const diff = target.getTime() - now.getTime();

  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, expired: true, isToday: false, isTomorrow: false };

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const isToday = days === 0;
  const isTomorrow = days === 1;

  return { days, hours, minutes, expired: false, isToday, isTomorrow };
}

/** Returns 'today' | 'tomorrow' | null for corner strip logic */
export function getClosingUrgency(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return null;
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  return null;
}
