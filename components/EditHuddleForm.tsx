"use client";

import { useMutation } from "convex/react";
import { FormEvent, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { CATEGORIES, catInfo, type Category } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { ImageUpload } from "@/components/ImageUpload";
import { Utensils, Trees, Gamepad2, BookOpen, Palette, Sparkles } from "lucide-react";
import type { Activity } from "@/components/ActivityCard";

const ICON_MAP = { Utensils, Trees, Gamepad2, BookOpen, Palette, Sparkles };

const inputClass =
  "w-full rounded-md border border-amber-900/15 bg-white/80 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 text-ink placeholder-ink/40 transition-all shadow-sm";

type EditHuddleFormProps = {
  activity: Activity;
  onSaved?: () => void;
};

export function EditHuddleForm({ activity, onSaved }: EditHuddleFormProps) {
  const update = useMutation(api.activities.update);
  const [category, setCategory] = useState<Category>(activity.category as Category);
  const [secretLocation, setSecretLocation] = useState(activity.secretLocation);
  const [isSaving, setIsSaving] = useState(false);
  const [imageId, setImageId] = useState<Id<"_storage"> | null>(
    activity.imageId ?? null,
  );
  const [imageUrl, setImageUrl] = useState<string | null>(activity.imageUrl ?? null);

  // Derive initial datetime-local value from whenTimestamp if present
  const initialDatetime = activity.whenTimestamp
    ? new Date(activity.whenTimestamp).toISOString().slice(0, 16)
    : "";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setIsSaving(true);

    const datetimeVal = String(form.get("whenDatetime") ?? "").trim();
    let whenTimestamp: number | undefined;
    let whenLabel: string;

    if (datetimeVal) {
      const d = new Date(datetimeVal);
      whenTimestamp = d.getTime();
      whenLabel = d.toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } else {
      whenLabel = String(form.get("when") ?? "").trim();
    }

    try {
      await update({
        activityId: activity._id,
        title: String(form.get("title") ?? "").trim(),
        category,
        location: String(form.get("location") ?? "").trim(),
        secretLocation,
        when: whenLabel,
        whenTimestamp,
        description: String(form.get("description") ?? "").trim(),
        spotsTotal: Number(form.get("spotsTotal") ?? activity.spotsTotal),
        imageId: imageId ?? undefined,
      });
      onSaved?.();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not update huddle");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-sm font-bold text-amber-950">Title</span>
          <input
            className={inputClass}
            name="title"
            defaultValue={activity.title}
            placeholder="Coffee after class"
            required
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-bold text-amber-950">Date & Time</span>
          <input
            className={inputClass}
            name="whenDatetime"
            type="datetime-local"
            defaultValue={initialDatetime}
          />
          <span className="text-xs text-ink/50">Or type freely:</span>
          <input
            className={inputClass}
            name="when"
            defaultValue={activity.when}
            placeholder="Today at 5pm"
          />
        </label>
      </div>

      <label className="space-y-1.5">
        <span className="text-sm font-bold text-amber-950">Location</span>
        <input
          className={inputClass}
          name="location"
          defaultValue={activity.location ?? ""}
          placeholder="Library steps"
          required
        />
      </label>

      <div className="space-y-2">
        <span className="text-sm font-bold text-amber-950">Category</span>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((item) => {
            const info = catInfo(item);
            const IconComponent = ICON_MAP[info.icon as keyof typeof ICON_MAP] || Sparkles;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 ${info.bg} ${info.text} ${info.border} ${
                  category === item
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-paper scale-105 shadow-md font-bold"
                    : "opacity-75 hover:opacity-100 shadow-sm"
                }`}
              >
                <IconComponent className="h-3.5 w-3.5 opacity-85" />
                {info.label}
              </button>
            );
          })}
        </div>
      </div>

      <ImageUpload
        value={imageId}
        previewUrl={imageUrl}
        onChange={(id, url) => {
          setImageId(id);
          setImageUrl(url);
        }}
      />

      <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
        <label className="space-y-1.5">
          <span className="text-sm font-semibold">Description</span>
          <textarea
            className={`${inputClass} min-h-24 resize-none`}
            name="description"
            defaultValue={activity.description}
            placeholder="What should people know?"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-semibold">Spots</span>
          <input
            className={inputClass}
            min={1}
            name="spotsTotal"
            required
            type="number"
            defaultValue={activity.spotsTotal}
          />
        </label>
      </div>

      <label className="flex items-center justify-between rounded-md border bg-white/55 px-3 py-2 text-sm font-semibold">
        Keep location secret until accepted
        <input
          checked={secretLocation}
          className="h-4 w-4 accent-[#a64d2d]"
          onChange={(e) => setSecretLocation(e.target.checked)}
          type="checkbox"
        />
      </label>

      <div className="flex justify-end gap-2">
        <DialogClose asChild>
          <Button type="button" variant="ghost">Cancel</Button>
        </DialogClose>
        <Button disabled={isSaving} type="submit">
          {isSaving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
