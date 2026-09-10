"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";

type ImageGalleryProps = {
  activityId: Id<"activities">;
};

export function ImageGallery({ activityId }: ImageGalleryProps) {
  const images = useQuery(api.imageGallery.getGallery, { activityId }) || [];

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 rounded-lg overflow-hidden border border-amber-900/15">
      <div className="relative h-64 w-full bg-gray-100">
        {images.length === 1 ? (
          <img
            src={images[0].url}
            alt="Activity"
            className="w-full h-full object-cover"
          />
        ) : (
          <Carousel className="w-full h-full">
            <CarouselContent>
              {images.map((img) => (
                <CarouselItem key={img._id}>
                  <img
                    src={img.url}
                    alt="Activity"
                    className="w-full h-64 object-cover"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-2" />
            <CarouselNext className="right-2" />
          </Carousel>
        )}
      </div>
      <div className="bg-amber-50 px-3 py-2 text-xs text-amber-900/70">
        {images.length} photo{images.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
