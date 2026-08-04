import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminPaymentProviders from "./AdminPaymentProviders";
import { db } from "@/lib/db";

export default async function PaymentProvidersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  const providers = await db.paymentProvider.findMany({});

  return (
    <div className="admin-theme min-h-screen p-6 text-right" lang="ar" dir="rtl">
      <h2 className="text-2xl font-black mb-4">إدارة مزوّدي الدفع المحلية</h2>
      <AdminPaymentProviders initialProviders={providers} />
    </div>
  );
}
