'use client';
export default function Error({ reset }) {
  return (
    <div className="container-x py-24">
      <div className="glass mx-auto max-w-md p-10 text-center">
        <p className="text-lg font-semibold text-white">Something went wrong</p>
        <p className="mt-2 text-sm text-slate-400">Please try again. If it keeps happening, contact us.</p>
        <button onClick={reset} className="btn-primary mt-6">Try again</button>
      </div>
    </div>
  );
}
