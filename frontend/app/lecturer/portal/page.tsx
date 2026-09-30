import { redirect } from "next/navigation";
import { getFaculty } from "@/lib/roles-auth";
import { LecturerPortal } from "@/components/portal/lecturer-portal";

export const dynamic = "force-dynamic";

export default async function LecturerPortalPage() {
  const faculty = await getFaculty();
  if (!faculty) redirect("/lecturer");
  return <LecturerPortal faculty={faculty} />;
}
