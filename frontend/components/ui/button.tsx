import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-royal text-white hover:bg-royal/90 active:scale-[0.98] shadow-subtle",
  secondary:
    "bg-surface text-ink border border-border hover:bg-surface-2 active:scale-[0.98]",
  ghost: "text-muted hover:text-ink hover:bg-surface-2",
  danger:
    "bg-danger/10 text-danger hover:bg-danger/15 active:scale-[0.98] border border-danger/20",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-md gap-1.5",
  md: "h-11 px-5 text-sm rounded-md gap-2",
  lg: "h-12 px-6 text-[15px] rounded-lg gap-2",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-royal",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

/** shared class string so <Link> can look like a button */
export function buttonClass(
  variant: Variant = "primary",
  size: Size = "md",
  className?: string
): string {
  return cn(
    "inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-royal",
    variants[variant],
    sizes[size],
    className
  );
}
