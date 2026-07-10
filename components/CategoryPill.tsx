import { catInfo } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { Utensils, Trees, Gamepad2, BookOpen, Palette, Sparkles } from "lucide-react";

const ICON_MAP = {
  Utensils,
  Trees,
  Gamepad2,
  BookOpen,
  Palette,
  Sparkles,
};

type CategoryPillProps = {
  category: string;
  active?: boolean;
  onClick?: () => void;
};

export function CategoryPill({ category, active, onClick }: CategoryPillProps) {
  const info = catInfo(category);
  const IconComponent = ICON_MAP[info.icon as keyof typeof ICON_MAP] || Sparkles;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-sm",
        info.bg,
        info.text,
        info.border,
        active 
          ? "ring-2 ring-primary ring-offset-2 ring-offset-[#f5dfb7] scale-105 shadow-md" 
          : "hover:bg-white/90",
      )}
    >
      <IconComponent className="h-3.5 w-3.5 opacity-80" />
      {info.label}
    </button>
  );
}

