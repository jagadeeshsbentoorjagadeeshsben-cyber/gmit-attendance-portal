import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginScreen } from "@/components/login-screen";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getSession();
  if (session) redirect("/dashboard");
  return <LoginScreen />;
}
