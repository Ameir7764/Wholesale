import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import RegisterClient from "./RegisterClient";

export default async function RegisterPage() {
  const session = await getCurrentUser();

  // If already logged in, redirect to correct workspace
  if (session) {
    if (session.role === "ADMIN") redirect("/admin/dashboard");
    if (session.role === "WHOLESALER") redirect("/wholesaler/dashboard");
    if (session.role === "RETAILER") redirect("/retailer/marketplace");
  }

  return <RegisterClient />;
}
