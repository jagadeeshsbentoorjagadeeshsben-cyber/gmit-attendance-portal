"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

interface AttendanceRingProps {
  percentage: number;
  hex: string;
  size?: number;
  stroke?: number;
  threshold?: number;
  children?: ReactNode;
}

/**
 * Signature GMIT attendance visualization: a radial ring with a subtle 75%
 * threshold marker. The progress arc eases in on mount via a CSS transition
 * (guaranteed to reach its final value even if animation is skipped).
 */
export function AttendanceRing({
  percentage,
  hex,
  size = 220,
  stroke = 16,
  threshold = 75,
  children,
}: AttendanceRingProps) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const c = size / 2;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, percentage));
  const finalOffset = circumference * (1 - pct / 100);
  const offset = shown ? finalOffset : circumference;
  const tickAngle = (threshold / 100) * 360;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="block">
        <defs>
          <linearGradient id="ring-fill" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={hex} />
            <stop offset="100%" stopColor={hex} stopOpacity="0.75" />
          </linearGradient>
        </defs>

        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke="hsl(var(--surface-2))"
          strokeWidth={stroke}
        />

        <circle
          cx={c}
          cy={c}
          r={r}
          fill="none"
          stroke="url(#ring-fill)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${c} ${c})`}
          style={{ transition: "stroke-dashoffset 1.1s cubic-bezier(0.16,1,0.3,1)" }}
        />

        <g transform={`rotate(${tickAngle} ${c} ${c})`}>
          <line
            x1={c}
            y1={c - r - stroke / 2 - 3}
            x2={c}
            y2={c - r + stroke / 2 + 3}
            stroke="hsl(var(--ink))"
            strokeOpacity={0.35}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </g>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
      <span
        className="absolute rounded-full px-1.5 py-0.5 text-[9px] font-semibold text-muted"
        style={{ left: 6, top: "50%", transform: "translateY(-50%)" }}
      >
        {threshold}%
      </span>
    </div>
  );
}
