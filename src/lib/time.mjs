// Clock helpers. In-world times are strings like "9:36 PM" or "12:00 AM".

// Minutes after noon on party day (so 12:00 AM = 720, i.e. midnight sorts last).
export function parseClock(str) {
  const m = /^~?\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(str ?? '').trim());
  if (!m) return null;
  let h = Number(m[1]) % 12;
  const min = Number(m[2]);
  const pm = m[3].toUpperCase() === 'PM';
  if (pm) return h * 60 + min; // noon-based
  return (h + 12) * 60 + min; // AM after midnight
}

export function formatClock(minutes) {
  const h24 = (12 + Math.floor(minutes / 60)) % 24;
  const m = ((minutes % 60) + 60) % 60;
  return `${h24 % 12 || 12}:${String(m).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
}

// Interval for an entry with at/until.
export function interval(entry) {
  const start = parseClock(entry.at);
  if (start == null) return null;
  const end = entry.until ? parseClock(entry.until) : start;
  if (end == null) return null;
  return [start, end];
}

export function overlaps([a1, a2], [b1, b2]) {
  return a1 <= b2 && b1 <= a2;
}

// Convert a wall-clock date + time in an IANA time zone to a UTC Date.
export function zonedToUtc(dateStr, timeStr, timeZone) {
  const [y, mo, d] = dateStr.split('-').map(Number);
  const [hh, mm] = timeStr.split(':').map(Number);
  const guess = Date.UTC(y, mo - 1, d, hh, mm);
  const offset = tzOffsetMinutes(new Date(guess), timeZone);
  let utc = guess - offset * 60000;
  const offset2 = tzOffsetMinutes(new Date(utc), timeZone);
  if (offset2 !== offset) utc = guess - offset2 * 60000;
  return new Date(utc);
}

function tzOffsetMinutes(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return Math.round((asUtc - date.getTime()) / 60000);
}

export function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + days));
  return t.toISOString().slice(0, 10);
}

export function formatTimeIn(date, timeZone) {
  return new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: '2-digit' }).format(date);
}
