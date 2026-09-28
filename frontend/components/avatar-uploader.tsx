"use client";

import { useRef, useState } from "react";
import { Camera, Trash2, ImagePlus } from "lucide-react";
import { useProfile } from "./profile-provider";
import { ProfileAvatar } from "./profile-avatar";
import { Button } from "./ui/button";

const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_BYTES = 2 * 1024 * 1024;

export function AvatarUploader({ name }: { name: string }) {
  const { photo, setPhoto, removePhoto, saving } = useProfile();
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      setError("Please choose a PNG, JPG, WEBP or GIF image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be under 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const err = await setPhoto(String(reader.result));
      if (err) setError(err);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center" data-testid="avatar-uploader">
      <div className="relative">
        <ProfileAvatar photo={photo} name={name} size={112} className="ring-2" />
        <button
          type="button"
          aria-label="Change photo"
          data-testid="avatar-camera-button"
          onClick={() => fileRef.current?.click()}
          className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-bg bg-royal text-white shadow-lift transition-transform hover:scale-105"
        >
          <Camera className="h-4 w-4" />
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        data-testid="avatar-file-input"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={camRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <div className="mt-4 flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={saving}
          onClick={() => fileRef.current?.click()}
          data-testid="avatar-upload-button"
        >
          <ImagePlus className="h-4 w-4" />
          {photo ? "Change" : "Add photo"}
        </Button>
        {photo && (
          <Button
            variant="danger"
            size="sm"
            disabled={saving}
            onClick={() => removePhoto()}
            data-testid="avatar-remove-button"
          >
            <Trash2 className="h-4 w-4" />
            Remove
          </Button>
        )}
      </div>
      {error && (
        <p className="mt-2 text-xs text-danger" data-testid="avatar-error">
          {error}
        </p>
      )}
    </div>
  );
}
