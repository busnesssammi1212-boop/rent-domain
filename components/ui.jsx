export function Badge({ tone = 'slate', children }) {
  const tones = {
    green: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
    amber: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
    red: 'border-rose-400/40 bg-rose-400/10 text-rose-300',
    violet: 'border-violet-400/40 bg-violet-400/10 text-violet-300',
    slate: 'border-white/15 bg-white/5 text-slate-300',
  };
  return <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}
export const Skeleton = ({ className = 'h-6 w-full' }) => <div className={`skeleton ${className}`} aria-hidden />;
export function EmptyState({ title, children, action }) {
  return (
    <div className="glass mx-auto max-w-md p-10 text-center">
      <p className="text-lg font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm text-slate-400">{children}</p>
      {action}
    </div>
  );
}
export const statusTone = { AVAILABLE: 'green', RENTED: 'amber', UNAVAILABLE: 'red', ACTIVE: 'green', PENDING_PAYMENT: 'amber', PENDING_VERIFICATION: 'violet', EXPIRED: 'slate', CANCELLED: 'red', REVOKED: 'red', APPROVED: 'green', REJECTED: 'red' };
