import BookingPanel from '@/components/BookingPanel';
export const metadata = { title: 'Your Booking', robots: { index: false } };
export default function BookingPage({ params }) {
  return <div className="container-x max-w-3xl py-12"><BookingPanel reference={params.ref} /></div>;
}
