import { NOW } from '../data/thread';

const time = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

function relative(d) {
  const hours = Math.floor((NOW - d) / 36e5);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days > 14) return '';
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

const withRelative = (text, d) => {
  const rel = relative(d);
  return rel ? `${text} (${rel})` : text;
};

// Collapsed row, like Gmail: "Thu, Sep 24, 3:14 PM (8 days ago)"
export function formatRowDate(iso) {
  const d = new Date(iso);
  const day = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  return withRelative(`${day}, ${time(d)}`, d);
}

// Expanded email header: "Sep 24, 2026, 3:14 PM (8 days ago)"
export function formatFullDate(iso) {
  const d = new Date(iso);
  const day = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return withRelative(`${day}, ${time(d)}`, d);
}

// Timeline point prefix: "Sep 24"
export function formatShortDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Tooltip on a Timeline date: "Mon, Sep 21, 2026, 9:12 AM"
export function formatTooltipDate(iso) {
  const d = new Date(iso);
  const day = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${day}, ${time(d)}`;
}

// Quote header: "Sep 30, 9:05 AM"
export function formatQuoteDate(iso) {
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${time(d)}`;
}
