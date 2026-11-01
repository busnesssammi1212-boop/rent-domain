import Link from 'next/link';
import { EmptyState } from '@/components/ui';
export default function NotFound() {
  return <div className="container-x py-24"><EmptyState title="Page not found" action={<Link href="/explore" className="btn-primary mt-6">Explore domains</Link>}>The page or listing you are looking for does not exist.</EmptyState></div>;
}
