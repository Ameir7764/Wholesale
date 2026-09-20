/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: "ADMIN" | "WHOLESALER" | "RETAILER";
  isApproved: boolean;
  createdAt: string;
}

export interface Store {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  ownerId: string;
  isVerified: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  price: number;
  moq: number;
  packingUnit: string;
  stock: number;
  imageUrl: string | null;
  storeId: string;
  categoryId: string | null;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  retailerId: string;
  status: "PENDING" | "ACCEPTED" | "PREPARING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  total: number;
  paymentMethod: "CASH_ON_DELIVERY" | "WALLET" | "BANK_TRANSFER" | "MOBILE_WALLET";
  paymentStatus: "PENDING" | "COMPLETED" | "FAILED";
  paymentProviderId?: string | null;
  retailerNote?: string | null;
  sellerReply?: string | null;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  orderId: string | null;
  amount: number;
  type: "DEPOSIT" | "PAYMENT" | "WITHDRAWAL" | "REFUND";
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  reference: string | null;
  provider?: string | null;
  createdAt: string;
}

export interface PaymentProvider {
  id: string;
  name: string;
  accountNumber: string | null;
  instructions?: string | null;
  createdAt: string;
  storeId?: string | null;
}

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  createdAt: string;
}

const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required. Set it in your environment or Vercel project settings.");
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
