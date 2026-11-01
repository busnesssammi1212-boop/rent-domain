export const metadata = { title: 'Terms of Service' };
export default function Page() {
  return (
    <div className="container-x max-w-3xl space-y-4 py-12 text-slate-300">
      <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
      <p className="text-sm text-amber-300">Template text. Have it reviewed by a qualified professional and replace the placeholders before going live.</p>
      <h2 className="pt-4 text-xl font-semibold text-white">1. Service</h2>
      <p>RENTEX DOMAINS offers time-limited rental of access to domains that are verified as owned or controlled by the operator. Listings marked SAMPLE are demonstration data and are not offered for rent.</p>
      <h2 className="pt-4 text-xl font-semibold text-white">2. Ownership</h2>
      <p>Renting a domain does not transfer ownership. The domain owner retains full administrative control at all times.</p>
      <h2 className="pt-4 text-xl font-semibold text-white">3. Payments</h2>
      <p>Payments are verified manually. Submitting a transaction ID or hash is not confirmation of payment. A rental starts only when an administrator approves the payment. Rejected payments do not activate a rental. Refund policy: [operator to define].</p>
      <h2 className="pt-4 text-xl font-semibold text-white">4. Rental period</h2>
      <p>The rental period begins at activation, as recorded by our server, and ends at the server-recorded expiration time. On expiry, access is revoked automatically.</p>
      <h2 className="pt-4 text-xl font-semibold text-white">5. Acceptable use</h2>
      <p>You must not use a rented domain for unlawful, fraudulent, abusive or malicious purposes. We may revoke a rental that violates these terms.</p>
      <h2 className="pt-4 text-xl font-semibold text-white">6. Liability</h2>
      <p>The service is provided as is, to the extent permitted by law. [Operator legal entity, jurisdiction and limitation of liability to be inserted.]</p>
    </div>
  );
}
