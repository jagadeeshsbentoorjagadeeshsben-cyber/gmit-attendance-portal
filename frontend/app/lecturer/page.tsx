import { redirect } from "next/navigation";
import { getFaculty } from "@/lib/roles-auth";
import { LecturerAuth } from "@/components/portal/lecturer-auth";

export const dynamic = "force-dynamic";

export default async function LecturerPage() {
  if (await getFaculty()) redirect("/lecturer/portal");
  return <LecturerAuth />;
}
