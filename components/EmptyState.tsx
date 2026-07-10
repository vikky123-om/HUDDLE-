import { ClipboardList, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  isFiltered?: boolean;
  onReset?: () => void;
  onCreateHuddle?: () => void;
};

export function EmptyState({ isFiltered, onReset, onCreateHuddle }: EmptyStateProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-lg border-2 border-dashed border-amber-900/25 bg-paper/90 p-8 text-center shadow-sm">
      {isFiltered ? (
        <SearchX className="h-12 w-12 text-amber-900/40 animate-pulse" />
      ) : (
        <ClipboardList className="h-12 w-12 text-amber-900/40" />
      )}
      
      <h2 className="mt-4 font-display text-2xl font-bold text-amber-950">
        {isFiltered ? "No match found" : "No huddles yet"}
      </h2>
      
      <p className="mt-2 text-sm text-ink/75 leading-relaxed">
        {isFiltered
          ? "We couldn't find any huddles matching your current search or filters. Try widening your criteria."
          : "Start one for lunch, a walk, a study session, or whatever small plan needs a few good people."}
      </p>

      <div className="mt-6 flex flex-wrap gap-2.5 justify-center">
        {isFiltered && onReset && (
          <Button onClick={onReset} variant="outline" className="border-amber-900/20 hover:bg-amber-100">
            Clear all filters
          </Button>
        )}
        {onCreateHuddle && (
          <Button onClick={onCreateHuddle} className="bg-primary hover:bg-primary/95 text-white">
            Post a huddle
          </Button>
        )}
      </div>
    </div>
  );
}

