import { redirect } from "next/navigation";
import { getHod } from "@/lib/roles-auth";
import { HodPortal } from "@/components/portal/hod-portal";

export const dynamic = "force-dynamic";

export default async function HodPortalPage() {
  if (!(await getHod())) redirect("/hod");
  return <HodPortal />;
}
