export const metadata = { title: 'Privacy Policy' };
export default function Page() {
  return (
    <div className="container-x max-w-3xl space-y-4 py-12 text-slate-300">
      <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
      <p className="text-sm text-amber-300">Template text. Have it reviewed by a qualified professional before going live.</p>
      <h2 className="pt-4 text-xl font-semibold text-white">What we collect</h2>
      <p>Only what is needed to process a booking: your email or phone number, an optional display name, the domain and plan you chose, and the payment details you submit (transaction ID or hash, sender information, optional reference). We hash your secret status token and never store it in readable form.</p>
      <h2 className="pt-4 text-xl font-semibold text-white">How we use it</h2>
      <p>To verify payments, activate and expire rentals, show you your booking status, prevent fraud and abuse, and contact you about your booking.</p>
      <h2 className="pt-4 text-xl font-semibold text-white">Who can see it</h2>
      <p>Authorized administrators only. Customer data is never publicly accessible and other customers cannot view your booking.</p>
      <h2 className="pt-4 text-xl font-semibold text-white">Retention and requests</h2>
      <p>[Operator to define retention period.] To request access or deletion, use the Contact page.</p>
      <h2 className="pt-4 text-xl font-semibold text-white">Storage</h2>
      <p>Your browser stores your booking token locally on your device so you can reopen your booking. We use no tracking cookies on public pages.</p>
    </div>
  );
}
