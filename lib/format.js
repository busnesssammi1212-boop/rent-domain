export function formatDuration(sec) {
  if (sec < 3600) return `${Math.round(sec / 60)} minutes`;
  if (sec < 86400) return `${sec / 3600} hour${sec / 3600 > 1 ? 's' : ''}`;
  const d = sec / 86400;
  return `${d} day${d > 1 ? 's' : ''}`;
}
export const formatPrice = (n, cur) => `${Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 })} ${cur}`;
export const METHOD_LABEL = { BKASH: 'bKash', NAGAD: 'Nagad', ROCKET: 'Rocket', CRYPTO: 'Cryptocurrency' };
export const hueFor = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);
