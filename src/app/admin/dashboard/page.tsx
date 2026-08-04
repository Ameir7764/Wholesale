import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import AdminClient from "./AdminClient";
import "@/styles/variables.css";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  // Fetch all stores with their owners
  const stores = await db.store.findMany({
    include: {
      owner: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch all users
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Fetch all transactions with user profiles
  const transactions = await db.transaction.findMany({
    include: {
      user: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch all orders with retailer and store/item summaries
  const orders = await db.order.findMany({
    include: {
      retailer: true,
      items: {
        include: {
          product: {
            include: {
              store: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate statistics
  const totalVolume = orders
    .filter((o: any) => ["ACCEPTED", "PREPARING", "SHIPPED", "DELIVERED"].includes(o.status))
    .reduce((sum: number, o: any) => sum + o.total, 0);

  const pendingStoresCount = stores.filter((s: any) => !s.isVerified).length;
  const pendingDepositsCount = transactions.filter((t: any) => t.type === "DEPOSIT" && t.status === "PENDING").length;

  const stats = {
    totalVolume,
    pendingStoresCount,
    pendingDepositsCount,
    retailersCount: users.filter((u: any) => u.role === "RETAILER").length,
    wholesalersCount: users.filter((u: any) => u.role === "WHOLESALER").length,
  };

  return (
    <div className="admin-theme min-h-screen">
      <AdminClient
        user={user}
        stores={stores}
        users={users}
        transactions={transactions}
        orders={orders}
        stats={stats}
      />
    </div>
  );
}
