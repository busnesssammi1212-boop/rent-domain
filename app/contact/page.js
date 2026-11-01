export const metadata = { title: 'Contact' };
// Set NEXT_PUBLIC_CONTACT_EMAIL in your environment. No contact form is provided, so there is no unauthenticated write endpoint to abuse.
export default function Page() {
  const email = process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  return (
    <div className="container-x max-w-xl py-12">
      <h1 className="text-3xl font-bold text-white">Contact</h1>
      <div className="glass mt-8 p-6">
        {email ? (<><p className="text-slate-300">For booking or payment questions, email us and include your booking reference. Never send your secret status token.</p><a className="btn-primary mt-6" href={`mailto:${email}`}>{email}</a></>)
          : <p className="text-slate-300">Contact details have not been configured yet. The site owner must set <code className="rounded bg-black/40 px-1">NEXT_PUBLIC_CONTACT_EMAIL</code>.</p>}
      </div>
    </div>
  );
}
