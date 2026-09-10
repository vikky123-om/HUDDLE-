"use client";

import { useCallback, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type ImageUploadProps = {
  activityId: Id<"activities">;
  onImageAdded?: () => void;
};

export function ImageUploadWidget({ activityId, onImageAdded }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const generateUploadUrl = useMutation(api.imageGallery.generateUploadUrl);
  const addImage = useMutation(api.imageGallery.addImage);

  const handleUpload = useCallback(
    async (file: File) => {
      try {
        setUploading(true);
        const uploadUrl = await generateUploadUrl({ activityId });

        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(uploadUrl, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Upload failed");

        const { storageId } = await response.json();
        await addImage({ activityId, storageId });
        onImageAdded?.();
      } catch (error) {
        alert(error instanceof Error ? error.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [activityId, generateUploadUrl, addImage, onImageAdded]
  );

  return (
    <div className="rounded-lg border-2 border-dashed border-amber-900/20 p-6 text-center hover:border-amber-900/40 transition-colors">
      <Upload className="h-8 w-8 text-amber-900/50 mx-auto mb-2" />
      <label className="cursor-pointer">
        <span className="font-semibold text-amber-950">Upload photos</span>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => {
            if (e.target.files) {
              Array.from(e.target.files).forEach(handleUpload);
            }
          }}
          disabled={uploading}
          className="hidden"
        />
      </label>
      <p className="text-xs text-ink/50 mt-1">
        {uploading ? "Uploading..." : "Drag and drop or click to select"}
      </p>
    </div>
  );
}
