import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Welcome } from "@/components/welcome";

export const dynamic = "force-dynamic";

export default async function WelcomePage() {
  const session = await getSession();
  if (!session) redirect("/");
  return <Welcome student={session} />;
}
