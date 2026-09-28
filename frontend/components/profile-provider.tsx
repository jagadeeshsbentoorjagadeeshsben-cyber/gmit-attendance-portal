"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface ProfileState {
  photo: string | null;
  loading: boolean;
  saving: boolean;
  setPhoto: (dataUrl: string) => Promise<string | null>;
  removePhoto: () => Promise<void>;
}

const Ctx = createContext<ProfileState | null>(null);

export function useProfile(): ProfileState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [photo, setPhotoState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/gs/profile", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : { photo: null }))
      .then((j) => {
        if (active) setPhotoState(j.photo ?? null);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const setPhoto = useCallback(async (dataUrl: string) => {
    setSaving(true);
    try {
      const res = await fetch("/gs/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ photo: dataUrl }),
      });
      const json = await res.json();
      if (!res.ok) return json.error ?? "Could not save photo.";
      setPhotoState(json.photo ?? null);
      return null;
    } catch {
      return "Could not save photo.";
    } finally {
      setSaving(false);
    }
  }, []);

  const removePhoto = useCallback(async () => {
    setSaving(true);
    try {
      await fetch("/gs/profile", {
        method: "DELETE",
        credentials: "same-origin",
      });
      setPhotoState(null);
    } finally {
      setSaving(false);
    }
  }, []);

  return (
    <Ctx.Provider value={{ photo, loading, saving, setPhoto, removePhoto }}>
      {children}
    </Ctx.Provider>
  );
}
