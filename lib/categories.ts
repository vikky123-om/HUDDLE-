export const COLORS = {
  food: {
    label: "Food",
    bg: "bg-rose-100/90",
    text: "text-rose-900",
    border: "border-rose-300",
    pinBg: "bg-rose-600",
    icon: "Utensils",
  },
  outdoors: {
    label: "Outdoors",
    bg: "bg-emerald-100/90",
    text: "text-emerald-900",
    border: "border-emerald-300",
    pinBg: "bg-emerald-600",
    icon: "Trees",
  },
  games: {
    label: "Games",
    bg: "bg-sky-100/90",
    text: "text-sky-900",
    border: "border-sky-300",
    pinBg: "bg-sky-600",
    icon: "Gamepad2",
  },
  study: {
    label: "Study",
    bg: "bg-violet-100/90",
    text: "text-violet-900",
    border: "border-violet-300",
    pinBg: "bg-violet-600",
    icon: "BookOpen",
  },
  arts: {
    label: "Arts",
    bg: "bg-amber-100/90",
    text: "text-amber-950",
    border: "border-amber-300",
    pinBg: "bg-amber-600",
    icon: "Palette",
  },
  other: {
    label: "Other",
    bg: "bg-stone-100/90",
    text: "text-stone-900",
    border: "border-stone-300",
    pinBg: "bg-stone-600",
    icon: "Sparkles",
  },
} as const;

export type Category = keyof typeof COLORS;

export const CATEGORIES = Object.keys(COLORS) as Category[];

export function catInfo(category: string) {
  return COLORS[category as Category] ?? COLORS.other;
}

export function seededRotation(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 7) - 3;
}

