import { redirect } from "next/navigation";
import { getHod } from "@/lib/roles-auth";
import { HodAuth } from "@/components/portal/hod-auth";

export const dynamic = "force-dynamic";

export default async function HodPage() {
  if (await getHod()) redirect("/hod/portal");
  return <HodAuth />;
}
