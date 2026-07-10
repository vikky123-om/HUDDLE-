import ProfilePageClient from "./ProfilePageClient";

type Props = {
  params: Promise<{ userId: string }>;
};

export default async function ProfilePage({ params }: Props) {
  const { userId } = await params;
  return <ProfilePageClient userId={userId} />;
}
