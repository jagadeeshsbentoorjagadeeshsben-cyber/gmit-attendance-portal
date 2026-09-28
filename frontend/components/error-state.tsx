"use client";

import { CloudOff, RotateCw } from "lucide-react";
import { Button } from "./ui/button";

export function ErrorState({
  message = "Attendance data couldn't be loaded.",
  onRetry,
  retrying,
}: {
  message?: string;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  return (
    <div
      data-testid="error-state"
      className="flex flex-col items-center justify-center rounded-lg border border-border bg-surface py-14 text-center"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger/10">
        <CloudOff className="h-6 w-6 text-danger" />
      </div>
      <p className="text-base font-semibold text-ink">Something went wrong</p>
      <p className="mt-1 max-w-xs text-sm text-muted">{message}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          disabled={retrying}
          variant="secondary"
          className="mt-5"
          data-testid="error-retry-button"
        >
          <RotateCw className={retrying ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Try again
        </Button>
      )}
    </div>
  );
}
