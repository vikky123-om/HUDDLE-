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

const ICON_MAP = {
  Utensils,
  Trees,
  Gamepad2,
  BookOpen,
  Palette,
  Sparkles,
};

type NewHuddleFormProps = {
  onCreated?: () => void;
};

const inputClass =
  "w-full rounded-md border border-amber-900/15 bg-white/80 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 text-ink placeholder-ink/40 transition-all shadow-sm";

export function NewHuddleForm({ onCreated }: NewHuddleFormProps) {
  const create = useMutation(api.activities.create);
  const [category, setCategory] = useState<Category>("food");
  const [secretLocation, setSecretLocation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageId, setImageId] = useState<Id<"_storage"> | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

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
      // Fall back to the free-text field
      whenLabel = String(form.get("when") ?? "").trim();
    }

    if (!whenLabel) {
      alert("Please set a date/time.");
      setIsSaving(false);
      return;
    }

    try {
      await create({
        title: String(form.get("title") ?? "").trim(),
        category,
        location: String(form.get("location") ?? "").trim(),
        secretLocation,
        when: whenLabel,
        whenTimestamp,
        description: String(form.get("description") ?? "").trim(),
        spotsTotal: Number(form.get("spotsTotal") ?? 4),
        imageId: imageId ?? undefined,
      });
      event.currentTarget.reset();
      setSecretLocation(false);
      setImageId(null);
      setImageUrl(null);
      onCreated?.();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not create huddle");
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
            placeholder="Coffee after class"
            required
          />
        </label>
        <div className="space-y-1.5">
          <span className="text-sm font-bold text-amber-950">Date &amp; Time</span>
          <input
            className={inputClass}
            name="whenDatetime"
            type="datetime-local"
          />
          <span className="text-xs text-ink/50">Or type freely:</span>
          <input
            className={inputClass}
            name="when"
            placeholder="Today at 5pm"
          />
        </div>
      </div>

      <label className="space-y-1.5">
        <span className="text-sm font-bold text-amber-950">Location</span>
        <input
          className={inputClass}
          name="location"
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
            defaultValue={4}
          />
        </label>
      </div>

      <label className="flex items-center justify-between rounded-md border bg-white/55 px-3 py-2 text-sm font-semibold">
        Keep location secret until accepted
        <input
          checked={secretLocation}
          className="h-4 w-4 accent-[#a64d2d]"
          onChange={(event) => setSecretLocation(event.target.checked)}
          type="checkbox"
        />
      </label>

      <div className="flex justify-end gap-2">
        <DialogClose asChild>
          <Button type="button" variant="ghost">
            Cancel
          </Button>
        </DialogClose>
        <Button disabled={isSaving} type="submit">
          {isSaving ? "Posting..." : "Post huddle"}
        </Button>
      </div>
    </form>
  );
}
