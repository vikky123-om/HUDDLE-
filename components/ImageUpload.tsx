"use client";

import { useMutation } from "convex/react";
import { useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ImagePlus, Loader2, X } from "lucide-react";

type ImageUploadProps = {
  value: Id<"_storage"> | null;
  previewUrl?: string | null;
  onChange: (id: Id<"_storage"> | null, url: string | null) => void;
};

export function ImageUpload({ previewUrl, onChange }: ImageUploadProps) {
  const generateUploadUrl = useMutation(api.activities.generateUploadUrl);
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(previewUrl ?? null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const url = await generateUploadUrl();
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await res.json();
      const preview = URL.createObjectURL(file);
      setLocalPreview(preview);
      onChange(storageId as Id<"_storage">, preview);
    } catch {
      alert("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function clear() {
    setLocalPreview(null);
    onChange(null, null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-1.5">
      <span className="text-sm font-bold text-amber-950">Cover Image (optional)</span>
      {localPreview ? (
        <div className="relative rounded-md overflow-hidden border border-amber-900/15 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={localPreview} alt="Cover" className="w-full h-36 object-cover" />
          <button
            type="button"
            onClick={clear}
            className="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-amber-900/20 bg-amber-50/40 py-6 text-sm font-medium text-amber-950/60 hover:border-amber-900/40 hover:bg-amber-50/70 hover:text-amber-950/80 transition-all"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
          {uploading ? "Uploading..." : "Click to upload image"}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
