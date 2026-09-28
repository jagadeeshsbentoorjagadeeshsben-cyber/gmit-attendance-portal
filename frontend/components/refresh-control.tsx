"use client";

import { RotateCw } from "lucide-react";
import { useAttendance } from "./attendance-provider";
import { timeAgo } from "@/lib/utils";
import { useEffect, useState } from "react";

export function RefreshControl() {
  const { lastUpdated, refresh, refreshing } = useAttendance();
  const [, tick] = useState(0);

  // re-render every 20s so "last updated" stays fresh
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 20000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center justify-between" data-testid="refresh-control">
      <p className="text-xs text-muted">
        {lastUpdated ? `Last updated ${timeAgo(lastUpdated)}` : "Syncing…"}
      </p>
      <button
        type="button"
        onClick={() => refresh()}
        disabled={refreshing}
        data-testid="refresh-button"
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-ink disabled:opacity-60"
      >
        <RotateCw className={refreshing ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
        Refresh
      </button>
    </div>
  );
}
