"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Logo } from "./logo";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const SECTIONS = ["3A", "3B", "5A", "5B", "7A", "7B"];

export function LoginScreen() {
  const router = useRouter();
  const [section, setSection] = useState<string>("");
  const [usn, setUsn] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!section) {
      setError("Please select your section.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/gs/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ section, usn: usn.trim().toUpperCase() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "We couldn't sign you in.");
        setLoading(false);
        return;
      }
      router.push("/welcome");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="ambient-glow pointer-events-none absolute inset-x-0 top-0 h-[420px]" />

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-10">
        <div className="animate-fade-up">
          <Logo className="mb-10" />
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Know Today.
            <br />
            Plan Tomorrow.
          </h1>
          <p className="mt-3 text-[15px] text-muted">
            Sign in with your section and USN to see exactly where your
            attendance stands.
          </p>
        </div>

        <form
          onSubmit={submit}
          style={{ animationDelay: "0.08s" }}
          className="mt-9 animate-fade-up rounded-lg border border-border bg-surface p-6 shadow-card"
          data-testid="login-form"
        >
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">
            Section
          </label>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Section">
            {SECTIONS.map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={section === s}
                data-testid={`section-${s}`}
                onClick={() => setSection(s)}
                className={cn(
                  "tnum h-11 rounded-md border text-sm font-semibold transition-all duration-150",
                  section === s
                    ? "border-royal bg-royal text-white shadow-subtle"
                    : "border-border bg-surface text-ink hover:border-royal/40 hover:bg-surface-2"
                )}
              >
                {s}
              </button>
            ))}
          </div>

          <label
            htmlFor="usn"
            className="mb-2 mt-6 block text-xs font-semibold uppercase tracking-wide text-muted"
          >
            USN
          </label>
          <input
            id="usn"
            data-testid="usn-input"
            value={usn}
            onChange={(e) => setUsn(e.target.value.toUpperCase())}
            placeholder="4GM24CS052"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            className="tnum h-12 w-full rounded-md border border-border bg-surface px-4 text-[15px] font-medium tracking-wide text-ink placeholder:text-muted/60 focus:border-royal focus:outline-none"
          />

          {error && (
            <div
              data-testid="login-error"
              className="mt-4 flex items-start gap-2 rounded-md border border-danger/20 bg-danger/10 px-3 py-2.5 text-sm text-danger"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="mt-6 w-full"
            data-testid="login-submit"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking…
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-4 text-xs font-medium text-muted">
          <a href="/lecturer" className="hover:text-royal transition-colors" data-testid="link-lecturer">Lecturer portal</a>
          <span className="text-border">•</span>
          <a href="/hod" className="hover:text-royal transition-colors" data-testid="link-hod">HOD portal</a>
        </div>
      </div>
    </main>
  );
}
