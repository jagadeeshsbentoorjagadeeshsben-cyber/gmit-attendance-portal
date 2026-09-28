import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AppFrame } from "@/components/app-frame";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/");
  return <AppFrame student={session}>{children}</AppFrame>;
}
