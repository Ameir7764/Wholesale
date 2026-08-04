import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import MarketplaceClient from "./MarketplaceClient";
import "@/styles/variables.css";

export const dynamic = "force-dynamic";

export default async function RetailerMarketplacePage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "RETAILER") {
    redirect("/");
  }

  // Fetch all categories
  const categories = await db.category.findMany({
    orderBy: { name: "asc" },
  });

  // Fetch all verified stores' products
  const products = await db.product.findMany({
    where: {
      store: {
        isVerified: true,
      },
    },
    include: {
      store: true,
      category: true,
    },
    orderBy: { name: "asc" },
  });

  // Fetch user's transactions to calculate balance
  const transactions = await db.transaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  // Calculate wallet balance (Deposits - Completed Payments)
  const deposits = transactions
    .filter((t: any) => t.type === "DEPOSIT" && t.status === "COMPLETED")
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  const payments = transactions
    .filter((t: any) => t.type === "PAYMENT" && t.status === "COMPLETED")
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  const walletBalance = deposits - payments;

  // Fetch user's orders to show history
  const orders = await db.order.findMany({
    where: { retailerId: user.id },
    include: {
      items: {
        include: {
          product: {
            include: {
              store: true,
            },
          },
        },
      },
      paymentProvider: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch available payment providers (local wallets / bank accounts)
  const paymentProviders = await db.paymentProvider.findMany({});

  return (
    <div className="retailer-theme min-h-screen">
      <MarketplaceClient
        user={user}
        products={products}
        categories={categories}
        transactions={transactions}
        walletBalance={walletBalance}
        orders={orders}
        paymentProviders={paymentProviders}
      />
    </div>
  );
}
