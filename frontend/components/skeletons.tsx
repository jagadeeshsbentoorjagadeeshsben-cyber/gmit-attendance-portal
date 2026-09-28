import { cn } from "@/lib/utils";

function Block({ className }: { className?: string }) {
  return (
    <div className={cn("shimmer rounded-md bg-surface-2", className)} />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8" data-testid="dashboard-skeleton">
      <div className="flex items-center gap-3">
        <Block className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Block className="h-4 w-36" />
          <Block className="h-3 w-24" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-4 py-6">
        <Block className="h-56 w-56 rounded-full" />
        <Block className="h-4 w-64" />
      </div>
      <div className="space-y-3">
        <Block className="h-4 w-24" />
        {[0, 1, 2, 3].map((i) => (
          <Block key={i} className="h-[84px] w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[0, 1, 2, 3, 4].map((i) => (
        <Block key={i} className="h-[84px] w-full rounded-lg" />
      ))}
    </div>
  );
}
