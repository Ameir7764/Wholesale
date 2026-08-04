import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import WholesalerClient from "./WholesalerClient";
import "@/styles/variables.css";

export const dynamic = "force-dynamic";

export default async function WholesalerDashboardPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "WHOLESALER") {
    redirect("/");
  }

  // Fetch the wholesaler's store
  const store = await db.store.findUnique({
    where: { ownerId: user.id },
  });

  if (!store) {
    // If wholesaler profile exists but no store record is found
    return (
      <div className="wholesaler-theme min-h-screen flex items-center justify-center text-center p-6" lang="ar" dir="rtl">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md space-y-4">
          <h2 className="text-xl font-bold text-red-500">حساب المتجر غير مكتمل</h2>
          <p className="text-slate-400 text-sm">
            نعتذر، لم يتم العثور على سجل متجر نشط مرتبط بحساب الموزع الخاص بك. يرجى التواصل مع الإدارة العامة لتفعيل متجرك.
          </p>
          <a href="/" className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-sm transition-colors">
            العودة للرئيسية
          </a>
        </div>
      </div>
    );
  }

  // Fetch store products
  const products = await db.product.findMany({
    where: { storeId: store.id },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  // Fetch categories for product forms
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
  });

  // Fetch orders containing products from this store
  const orders = await db.order.findMany({
    where: {
      items: {
        some: {
          product: {
            storeId: store.id,
          },
        },
      },
    },
    include: {
      retailer: true,
      paymentProvider: true,
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate stats
  const activeOrdersCount = orders.filter((o: any) => ["PENDING", "ACCEPTED", "PREPARING", "SHIPPED"].includes(o.status)).length;
  const outOfStockCount = products.filter((p: any) => p.stock <= 0).length;

  // Calculate total revenue from accepted/completed orders (excluding cancelled/pending)
  const revenueOrders = orders.filter((o: any) => ["ACCEPTED", "PREPARING", "SHIPPED", "DELIVERED"].includes(o.status));
  
  // To get exact store portion, we sum up store's order items
  let totalRevenue = 0;
  revenueOrders.forEach((order: any) => {
    order.items.forEach((item: any) => {
      if (item.product.storeId === store.id) {
        totalRevenue += item.price * item.quantity;
      }
    });
  });

  return (
    <div className="wholesaler-theme min-h-screen">
      <WholesalerClient
        user={user}
        store={store}
        products={products}
        categories={categories}
        orders={orders}
        stats={{
          totalRevenue,
          activeOrdersCount,
          outOfStockCount,
          totalProductsCount: products.length,
        }}
      />
    </div>
  );
}
