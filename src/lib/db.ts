/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "./crypto";

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

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Seeded In-Memory Database Fallback for Vercel when DATABASE_URL is not configured
const inMemoryData: {
  users: any[];
  stores: any[];
  products: any[];
  categories: any[];
  orders: any[];
  orderItems: any[];
  transactions: any[];
  paymentProviders: any[];
} = {
  users: [
    {
      id: "u-wholesaler-1",
      email: "rawabi@marketplace.com",
      password: hashPassword("wholesaler123"),
      name: "شركة الروابي للتجارة بالجملة",
      role: "WHOLESALER",
      isApproved: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "u-retailer-1",
      email: "baqala_noor@marketplace.com",
      password: hashPassword("retailer123"),
      name: "بقالة النور للتجزئة",
      role: "RETAILER",
      isApproved: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "u-admin-1",
      email: "admin@marketplace.com",
      password: hashPassword("adminpassword123"),
      name: "مدير المنصة (م/أمير علي)",
      role: "ADMIN",
      isApproved: true,
      createdAt: new Date().toISOString(),
    },
  ],
  stores: [
    {
      id: "store-rawabi",
      name: "شركة الروابي للمواد الغذائية",
      description: "الموزع المعتمد للألبان والمواد الغذائية الأساسية بالجملة",
      logoUrl: null,
      ownerId: "u-wholesaler-1",
      isVerified: true,
      createdAt: new Date().toISOString(),
    },
  ],
  categories: [
    { id: "cat-1", name: "مواد غذائية أساسية" },
    { id: "cat-2", name: "ألبان وأجبان" },
    { id: "cat-3", name: "مشروبات ومياه" },
    { id: "cat-4", name: "حلويات وبسكويت" },
  ],
  products: [
    {
      id: "prod-1",
      name: "حليب الروابي ممتازة 1 لتر (كرتون 12 حبة)",
      description: "حليب طازج كاملا الدسم سريع الاستهلاك",
      sku: "RAW-MILK-01",
      price: 18500,
      moq: 2,
      packingUnit: "كرتون",
      stock: 150,
      imageUrl: null,
      storeId: "store-rawabi",
      categoryId: "cat-2",
      createdAt: new Date().toISOString(),
    },
    {
      id: "prod-2",
      name: "أرز بسمتي فاخر (شوال 10 كجم)",
      description: "أرز هندي حبة طويلة ممتاز للبقالات",
      sku: "RAW-RICE-02",
      price: 42000,
      moq: 1,
      packingUnit: "شوال",
      stock: 80,
      imageUrl: null,
      storeId: "store-rawabi",
      categoryId: "cat-1",
      createdAt: new Date().toISOString(),
    },
    {
      id: "prod-3",
      name: "زيت عافية للطبخ 1.5 لتر (شدة 6 حبات)",
      description: "زيت طعام نقي وخفيف",
      sku: "RAW-OIL-03",
      price: 26000,
      moq: 2,
      packingUnit: "شدة",
      stock: 120,
      imageUrl: null,
      storeId: "store-rawabi",
      categoryId: "cat-1",
      createdAt: new Date().toISOString(),
    },
    {
      id: "prod-4",
      name: "عصير برتقال طبيعي 250 مل (كرتون 24 حبة)",
      description: "عصير عبوات صغيرة مناسبة للبقالات والمدارس",
      sku: "RAW-JUICE-04",
      price: 14000,
      moq: 3,
      packingUnit: "كرتون",
      stock: 200,
      imageUrl: null,
      storeId: "store-rawabi",
      categoryId: "cat-3",
      createdAt: new Date().toISOString(),
    },
  ],
  orders: [],
  orderItems: [],
  transactions: [
    {
      id: "tx-1",
      userId: "u-retailer-1",
      orderId: null,
      amount: 150000,
      type: "DEPOSIT",
      status: "APPROVED",
      reference: "DEP-99201",
      createdAt: new Date().toISOString(),
    },
  ],
  paymentProviders: [],
};

// Create in-memory mock handler for Prisma when no DB URL is provided
function createInMemoryDb() {
  const findStoreForOwner = (ownerId: string) => inMemoryData.stores.find(s => s.ownerId === ownerId);

  return {
    user: {
      findUnique: async ({ where }: any) => {
        if (where.email) return inMemoryData.users.find((u) => u.email === where.email) || null;
        if (where.id) return inMemoryData.users.find((u) => u.id === where.id) || null;
        return null;
      },
      findMany: async (args?: any) => inMemoryData.users,
      create: async ({ data }: any) => {
        const newUser = { id: `u-${Date.now()}`, createdAt: new Date().toISOString(), isApproved: false, ...data };
        inMemoryData.users.push(newUser);
        return newUser;
      },
      update: async ({ where, data }: any) => {
        const u = inMemoryData.users.find((x) => x.id === where.id);
        if (u) Object.assign(u, data);
        return u;
      },
    },
    store: {
      findUnique: async ({ where }: any) => {
        if (where.id) return inMemoryData.stores.find((s) => s.id === where.id) || null;
        if (where.ownerId) return findStoreForOwner(where.ownerId) || null;
        return null;
      },
      findMany: async ({ include }: any = {}) => {
        return inMemoryData.stores.map((s) => ({
          ...s,
          owner: include?.owner ? inMemoryData.users.find((u) => u.id === s.ownerId) : undefined,
        }));
      },
      create: async ({ data }: any) => {
        const newStore = { id: `store-${Date.now()}`, isVerified: false, createdAt: new Date().toISOString(), ...data };
        inMemoryData.stores.push(newStore);
        return newStore;
      },
      update: async ({ where, data }: any) => {
        const st = inMemoryData.stores.find((s) => s.id === where.id);
        if (st) Object.assign(st, data);
        return st;
      },
    },
    product: {
      findUnique: async ({ where, include }: any) => {
        const p = inMemoryData.products.find((x) => x.id === where.id);
        if (!p) return null;
        return {
          ...p,
          store: include?.store ? inMemoryData.stores.find((s) => s.id === p.storeId) : undefined,
        };
      },
      findMany: async ({ where, include }: any = {}) => {
        let list = [...inMemoryData.products];
        if (where?.storeId) list = list.filter((p) => p.storeId === where.storeId);
        return list.map((p) => ({
          ...p,
          store: include?.store ? inMemoryData.stores.find((s) => s.id === p.storeId) : undefined,
          category: include?.category ? inMemoryData.categories.find((c) => c.id === p.categoryId) : undefined,
        }));
      },
      create: async ({ data }: any) => {
        const newP = { id: `prod-${Date.now()}`, createdAt: new Date().toISOString(), ...data };
        inMemoryData.products.push(newP);
        return newP;
      },
      update: async ({ where, data }: any) => {
        const p = inMemoryData.products.find((x) => x.id === where.id);
        if (p) {
          if (data.stock?.decrement) {
            p.stock = Math.max(0, p.stock - data.stock.decrement);
          } else {
            Object.assign(p, data);
          }
        }
        return p;
      },
      delete: async ({ where }: any) => {
        inMemoryData.products = inMemoryData.products.filter((p) => p.id !== where.id);
        return { success: true };
      },
    },
    category: {
      findMany: async () => inMemoryData.categories,
    },
    order: {
      findMany: async ({ where, include }: any = {}) => {
        let list = [...inMemoryData.orders];
        if (where?.retailerId) list = list.filter((o) => o.retailerId === where.retailerId);
        return list.map((o) => ({
          ...o,
          retailer: include?.retailer ? inMemoryData.users.find((u) => u.id === o.retailerId) : undefined,
          items: include?.items
            ? inMemoryData.orderItems
                .filter((item) => item.orderId === o.id)
                .map((item) => ({
                  ...item,
                  product: include?.items?.include?.product
                    ? {
                        ...inMemoryData.products.find((p) => p.id === item.productId),
                        store: inMemoryData.stores.find(
                          (s) => s.id === inMemoryData.products.find((p) => p.id === item.productId)?.storeId
                        ),
                      }
                    : undefined,
                }))
            : [],
        }));
      },
      create: async ({ data }: any) => {
        const orderId = `ord-${Date.now()}`;
        const newOrder = {
          id: orderId,
          retailerId: data.retailerId,
          status: data.status || "PENDING",
          total: data.total,
          paymentMethod: data.paymentMethod,
          paymentStatus: data.paymentStatus || "PENDING",
          createdAt: new Date().toISOString(),
        };
        inMemoryData.orders.push(newOrder);

        if (data.items?.create) {
          data.items.create.forEach((item: any) => {
            inMemoryData.orderItems.push({
              id: `item-${Date.now()}-${Math.random()}`,
              orderId,
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            });
          });
        }

        return newOrder;
      },
      update: async ({ where, data }: any) => {
        const o = inMemoryData.orders.find((x) => x.id === where.id);
        if (o) Object.assign(o, data);
        return o;
      },
    },
    transaction: {
      findMany: async ({ where, include }: any = {}) => {
        let list = [...inMemoryData.transactions];
        if (where?.userId) list = list.filter((t) => t.userId === where.userId);
        return list.map((t) => ({
          ...t,
          user: include?.user ? inMemoryData.users.find((u) => u.id === t.userId) : undefined,
        }));
      },
      create: async ({ data }: any) => {
        const newTx = { id: `tx-${Date.now()}`, createdAt: new Date().toISOString(), ...data };
        inMemoryData.transactions.push(newTx);
        return newTx;
      },
      update: async ({ where, data }: any) => {
        const tx = inMemoryData.transactions.find((x) => x.id === where.id);
        if (tx) Object.assign(tx, data);
        return tx;
      },
    },
    paymentProvider: {
      findMany: async () => inMemoryData.paymentProviders,
    },
  } as any;
}

// Instantiate PrismaClient if DATABASE_URL is set, otherwise use smart in-memory fallback
let dbInstance: any;

if (databaseUrl) {
  dbInstance = globalForPrisma.prisma ?? new PrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = dbInstance;
  }
} else {
  dbInstance = createInMemoryDb();
}

export const db = dbInstance;
