import { Metadata } from "next";
import HuddleDetailClient from "./HuddleDetailClient";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  // We can't call Convex from server components easily, so use static meta
  return {
    title: `Huddle · View Activity`,
    description: "Join this huddle on Huddle — pin a plan, find your people.",
    openGraph: {
      title: "Huddle · View Activity",
      description: "Join this huddle on Huddle — pin a plan, find your people.",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Huddle · View Activity",
      description: "Join this huddle on Huddle — pin a plan, find your people.",
    },
  };
}

export default async function HuddleDetailPage({ params }: Props) {
  const { id } = await params;
  return <HuddleDetailClient activityId={id} />;
}
