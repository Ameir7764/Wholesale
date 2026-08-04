import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import WholesalerPaymentProviders from "../WholesalerPaymentProviders";
import { db } from "@/lib/db";

export default async function WholesalerProvidersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "WHOLESALER") redirect("/");

  const store = await db.store.findFirst({ where: { ownerId: user.id } });
  if (!store) return <div className="p-6">لم يتم العثور على متجر مرتبط بهذا الحساب.</div>;

  const providers = await db.paymentProvider.findMany({ where: { storeId: store.id } });

  return (
    <div className="min-h-screen p-6" lang="ar" dir="rtl">
      <h2 className="text-2xl font-black mb-4">محافظ متجرك</h2>
      <WholesalerPaymentProviders initialProviders={providers} />
    </div>
  );
}
