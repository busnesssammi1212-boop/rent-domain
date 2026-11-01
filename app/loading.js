import { Skeleton } from '@/components/ui';
export default function Loading() {
  return (
    <div className="container-x space-y-6 py-16">
      <Skeleton className="h-10 w-2/3" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-64" />)}</div>
    </div>
  );
}
