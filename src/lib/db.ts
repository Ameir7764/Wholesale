/* eslint-disable @typescript-eslint/no-explicit-any */
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// Check if database URL is configured
const isRealDb = typeof process !== "undefined" && !!process.env.DATABASE_URL;

// Define Data Types for Mock Client
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
  // 'MOBILE_WALLET' used for local e-wallet providers / purchase codes
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
  instructions?: string | null; // e.g. كيفية الدفع أو رمز الشراء
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

interface Schema {
  users: User[];
  stores: Store[];
  products: Product[];
  categories: Category[];
  orders: Order[];
  orderItems: OrderItem[];
  transactions: Transaction[];
  paymentProviders: PaymentProvider[];
  cartItems: CartItem[];
}

const DB_DIR = path.join(process.cwd(), "prisma");
const DB_FILE = path.join(DB_DIR, "mock_db.json");

function loadDb(): Schema {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(data) as Schema;
    } catch (e) {
      console.error("Failed to parse mock database, initializing default schema.", e);
    }
  }

  const defaultSchema = getSeedData();
  saveDb(defaultSchema);
  return defaultSchema;
}

function saveDb(data: Schema) {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

class Collection<T extends { id: string }> {
  private key: keyof Schema;

  constructor(key: keyof Schema) {
    this.key = key;
  }

  private getAll(): T[] {
    const dbData = loadDb();
    return dbData[this.key] as unknown as T[];
  }

  private saveAll(items: T[]) {
    const dbData = loadDb();
    (dbData[this.key] as any) = items;
    saveDb(dbData);
  }

  async findMany(args?: any): Promise<any[]> {
    let items = this.getAll();

    if (args?.where) {
      items = items.filter((item: any) => {
        for (const [key, value] of Object.entries(args.where)) {
          if (value && typeof value === "object") {
            if ("some" in value) {
              const filterVal = (value as any).some;
              const dbData = loadDb();
              if (this.key === "orders") {
                const oItems = dbData.orderItems.filter((oi) => oi.orderId === item.id);
                const matches = oItems.some((oi) => {
                  if (filterVal.product?.storeId) {
                    const prod = dbData.products.find((p) => p.id === oi.productId);
                    return prod?.storeId === filterVal.product.storeId;
                  }
                  return false;
                });
                if (!matches) return false;
              }
            } else if ("ownerId" in value || "isVerified" in value) {
              if (this.key === "products") {
                const dbData = loadDb();
                const store = dbData.stores.find((s) => s.id === item.storeId);
                if (!store) return false;
                if ((value as any).isVerified !== undefined && store.isVerified !== (value as any).isVerified) {
                  return false;
                }
              }
            }
          } else {
            if (item[key] !== value) return false;
          }
        }
        return true;
      });
    }

    let result = items.map((item: any) => {
      const dbData = loadDb();
      const enriched = { ...item };

      if (args?.include) {
        if (args.include.owner && this.key === "stores") {
          enriched.owner = dbData.users.find((u) => u.id === item.ownerId);
        }
        if (args.include.store) {
          enriched.store = dbData.stores.find((s) => s.id === item.storeId);
        }
        if (args.include.category) {
          enriched.category = dbData.categories.find((c) => c.id === item.categoryId);
        }
        if (args.include.retailer && this.key === "orders") {
          enriched.retailer = dbData.users.find((u) => u.id === item.retailerId);
        }
        if (args.include.user && this.key === "transactions") {
          enriched.user = dbData.users.find((u) => u.id === item.userId);
        }
        if (args.include.items && this.key === "orders") {
          let oItems = dbData.orderItems.filter((oi) => oi.orderId === item.id);
          if (args.include.items.where?.product?.storeId) {
            oItems = oItems.filter((oi) => {
              const prod = dbData.products.find((p) => p.id === oi.productId);
              return prod?.storeId === args.include.items.where.product.storeId;
            });
          }
          enriched.items = oItems.map((oi) => {
            const innerItem: any = { ...oi };
            innerItem.product = dbData.products.find((p) => p.id === oi.productId);
            if (innerItem.product) {
              innerItem.product = { ...innerItem.product };
              innerItem.product.store = dbData.stores.find((s) => s.id === innerItem.product.storeId);
            }
            return innerItem;
          });
        }
        if (args.include.paymentProvider && this.key === "orders") {
          enriched.paymentProvider = dbData.paymentProviders.find((p) => p.id === (item as any).paymentProviderId);
        }
        if (args.include.product && this.key === "cartItems") {
          enriched.product = dbData.products.find((p) => p.id === item.productId);
        }
      }
      return enriched;
    });

    if (args?.orderBy) {
      for (const [key, value] of Object.entries(args.orderBy)) {
        result.sort((a, b) => {
          const valA = a[key];
          const valB = b[key];
          if (typeof valA === "string") {
            return value === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
          }
          return value === "asc" ? (valA as any) - (valB as any) : (valB as any) - (valA as any);
        });
      }
    }

    return result;
  }

  async findUnique(args: { where: any; include?: any }): Promise<any | null> {
    const items = await this.findMany({ where: args.where, include: args.include });
    return items[0] || null;
  }

  async findFirst(args: { where: any; include?: any }): Promise<any | null> {
    return this.findUnique(args);
  }

  async create(args: { data: any }): Promise<any> {
    const items = this.getAll();
    const newItem = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...args.data,
    };

    if (this.key === "orders" && args.data.items?.create) {
      const orderItemsToCreate = args.data.items.create;
      delete newItem.items;

      const dbData = loadDb();
      const createdItems = orderItemsToCreate.map((oi: any) => ({
        id: crypto.randomUUID(),
        orderId: newItem.id,
        productId: oi.productId,
        quantity: oi.quantity,
        price: oi.price,
      }));
      dbData.orderItems.push(...createdItems);
      saveDb(dbData);
    }

    items.push(newItem);
    this.saveAll(items);
    return newItem;
  }

  async update(args: { where: { id: string }; data: any }): Promise<any> {
    const items = this.getAll();
    const index = items.findIndex((i) => i.id === args.where.id);
    if (index === -1) throw new Error("Item not found");

    const updated = {
      ...items[index],
      ...args.data,
      updatedAt: new Date().toISOString(),
    };

    if (args.data.stock?.decrement !== undefined) {
      updated.stock = Math.max(0, (items[index] as any).stock - args.data.stock.decrement);
    }

    items[index] = updated;
    this.saveAll(items);
    return updated;
  }

  async delete(args: { where: { id: string } }): Promise<any> {
    const items = this.getAll();
    const filtered = items.filter((i) => i.id !== args.where.id);
    this.saveAll(filtered);
    return { id: args.where.id };
  }

  async deleteMany(args?: { where?: any }): Promise<any> {
    if (!args?.where) {
      this.saveAll([]);
      return { count: this.getAll().length };
    }

    const items = this.getAll();
    const filtered = items.filter((item) => {
      for (const [key, value] of Object.entries(args.where)) {
        if ((item as any)[key] !== value) return true;
      }
      return false;
    });
    const removed = items.length - filtered.length;
    this.saveAll(filtered);
    return { count: removed };
  }
}

function createMockDb() {
  return {
    user: new Collection<User>("users"),
    store: new Collection<Store>("stores"),
    product: new Collection<Product>("products"),
    category: new Collection<Category>("categories"),
    order: new Collection<Order>("orders"),
    orderItem: new Collection<OrderItem>("orderItems"),
    transaction: new Collection<Transaction>("transactions"),
    paymentProvider: new Collection<PaymentProvider>("paymentProviders"),
    cartItem: new Collection<CartItem>("cartItems"),
  };
}

// Global Prisma Singleton
const globalForPrisma = globalThis as unknown as {
  prisma: any;
};

let prisma: any = null;
if (isRealDb) {
  prisma = globalForPrisma.prisma ?? new PrismaClient();
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
}

// Export production Prisma or mock depending on environment variables
export const db: any = isRealDb ? prisma : createMockDb();

import { hashPassword } from "./crypto";

function getSeedData(): Schema {
  const adminId = "usr-admin-1";
  const wholesaler1Id = "usr-wholesaler-1";
  const wholesaler2Id = "usr-wholesaler-2";
  const retailer1Id = "usr-retailer-1";
  const retailer2Id = "usr-retailer-2";

  const store1Id = "store-rawabi-1";
  const store2Id = "store-yemen-2";

  const cat1Id = "cat-canned-1";
  const cat2Id = "cat-beverage-2";
  const cat3Id = "cat-detergent-3";
  const cat4Id = "cat-snack-4";

  return {
    users: [
      {
        id: adminId,
        email: "admin@marketplace.com",
        password: hashPassword("adminpassword123"),
        name: "أبو أحمد (المدير العام)",
        role: "ADMIN",
        isApproved: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: wholesaler1Id,
        email: "rawabi@marketplace.com",
        password: hashPassword("wholesaler123"),
        name: "شركة الروابي التجارية للجملة",
        role: "WHOLESALER",
        isApproved: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: wholesaler2Id,
        email: "yemen_dist@marketplace.com",
        password: hashPassword("wholesaler123"),
        name: "المؤسسة اليمنية للتوزيع والتجارة",
        role: "WHOLESALER",
        isApproved: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: retailer1Id,
        email: "baqala_noor@marketplace.com",
        password: hashPassword("retailer123"),
        name: "صالح العولقي (بقالة النور)",
        role: "RETAILER",
        isApproved: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: retailer2Id,
        email: "baqala_baraka@marketplace.com",
        password: hashPassword("retailer123"),
        name: "محمد اليماني (سوبرماركت البركة)",
        role: "RETAILER",
        isApproved: true,
        createdAt: new Date().toISOString(),
      },
    ],
    stores: [
      {
        id: store1Id,
        name: "مخازن الروابي للمواد الغذائية",
        description: "الموزع المعتمد لأرقى العلامات التجارية الغذائية، سرعة في التوصيل وأفضل أسعار الجملة.",
        logoUrl: "/logos/rawabi.png",
        ownerId: wholesaler1Id,
        isVerified: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: store2Id,
        name: "مخازن اليمن للتوزيع",
        description: "توفير كافة مستلزمات البقالات والتموينات من مشروبات ومواد تنظيف بجودة عالية.",
        logoUrl: "/logos/yemen_dist.png",
        ownerId: wholesaler2Id,
        isVerified: true,
        createdAt: new Date().toISOString(),
      },
    ],
    categories: [
      { id: cat1Id, name: "معلبات وأغذية" },
      { id: cat2Id, name: "مشروبات ومياه" },
      { id: cat3Id, name: "منظفات وعناية" },
      { id: cat4Id, name: "حلويات وتسالي" },
    ],
    products: [
      {
        id: "prod-tuna",
        name: "تونة الروابي قطعة واحدة - كرتون (48 حبة)",
        description: "تونة فاخرة بزيت دوار الشمس. وزن الحبة 160 جرام.",
        sku: "RAW-TUN-01",
        price: 24000.0,
        moq: 2,
        packingUnit: "كرتون",
        stock: 120,
        imageUrl: "/products/tuna.png",
        storeId: store1Id,
        categoryId: cat1Id,
        createdAt: new Date().toISOString(),
      },
      {
        id: "prod-beans",
        name: "فاصوليا مطبوخة حدائق طيبة - كرتون (24 حبة)",
        description: "فاصوليا حمراء جاهزة للأكل. وزن الحبة 400 جرام.",
        sku: "RAW-FAS-02",
        price: 9800.0,
        moq: 3,
        packingUnit: "كرتون",
        stock: 85,
        imageUrl: "/products/beans.png",
        storeId: store1Id,
        categoryId: cat1Id,
        createdAt: new Date().toISOString(),
      },
      {
        id: "prod-milk",
        name: "حليب مكثف الروابي - كرتون (48 حبة)",
        description: "حليب مكثف محلى لصنع الحلويات والشاي المميز.",
        sku: "RAW-MILK-03",
        price: 18500.0,
        moq: 1,
        packingUnit: "كرتون",
        stock: 50,
        imageUrl: "/products/milk.png",
        storeId: store1Id,
        categoryId: cat1Id,
        createdAt: new Date().toISOString(),
      },
      {
        id: "prod-water",
        name: "مياه معدنية يمنية - كرتون (24 حبة × 500 مل)",
        description: "مياه شرب نقية وصحية معبأة محلياً.",
        sku: "YEM-WAT-01",
        price: 1500.0,
        moq: 10,
        packingUnit: "كرتون",
        stock: 500,
        imageUrl: "/products/water.png",
        storeId: store2Id,
        categoryId: cat2Id,
        createdAt: new Date().toISOString(),
      },
      {
        id: "prod-pepsi",
        name: "مشروب غازي بيبسي عائلي - كرتون (6 حبات × 2.25 لتر)",
        description: "عبوات بيبسي الغازية حجم عائلي كبير.",
        sku: "YEM-PEP-02",
        price: 6800.0,
        moq: 5,
        packingUnit: "كرتون",
        stock: 150,
        imageUrl: "/products/pepsi.png",
        storeId: store2Id,
        categoryId: cat2Id,
        createdAt: new Date().toISOString(),
      },
      {
        id: "prod-detergent",
        name: "صابون غسيل مسحوق فلو - كيس (10 كيلو)",
        description: "مسحوق غسيل قوي للملابس البيضاء والملونة برائحة الياسمين.",
        sku: "YEM-DET-03",
        price: 7500.0,
        moq: 2,
        packingUnit: "كيس",
        stock: 90,
        imageUrl: "/products/detergent.png",
        storeId: store2Id,
        categoryId: cat3Id,
        createdAt: new Date().toISOString(),
      },
    ],
    orders: [
      {
        id: "order-sample-1",
        retailerId: retailer1Id,
        status: "PENDING",
        total: 33800.0,
        paymentMethod: "WALLET",
        paymentStatus: "PENDING",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
    orderItems: [
      {
        id: "oi-sample-1",
        orderId: "order-sample-1",
        productId: "prod-tuna",
        quantity: 1,
        price: 24000.0,
      },
      {
        id: "oi-sample-2",
        orderId: "order-sample-1",
        productId: "prod-beans",
        quantity: 1,
        price: 9800.0,
      },
    ],
    transactions: [
      {
        id: "tx-sample-1",
        userId: retailer1Id,
        orderId: "order-sample-1",
        amount: 33800.0,
        type: "PAYMENT",
        status: "PENDING",
        reference: "WLT-MOCK-99382",
        createdAt: new Date(Date.now() - 3550000).toISOString(),
      },
      {
        id: "tx-sample-2",
        userId: retailer1Id,
        orderId: null,
        amount: 150000.0,
        type: "DEPOSIT",
        status: "COMPLETED",
        reference: "DEP-MOCK-10022",
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      },
    ],
    paymentProviders: [
      {
        id: "prov-local-bank-1",
        name: "حوالة بنكية (تجريبي)",
        accountNumber: "000-111-222",
        instructions: "أرسل الحوالة إلى رقم الحساب ثم ضع رقم الإيصال كمرجع.",
        createdAt: new Date().toISOString(),
        storeId: null,
      },
      {
        id: "prov-jib-1",
        name: "جيب - محفظة إلكترونية (تجريبي)",
        accountNumber: "JIB-0001",
        instructions: "أرسل كود الشراء إلى 7700 ثم ضع الكود هنا لإتمام الدفع.",
        createdAt: new Date().toISOString(),
        storeId: null,
      },
      {
        id: "prov-sadad-1",
        name: "سداد - رمز شراء (تجريبي)",
        accountNumber: "SAD-0001",
        instructions: "استخدم رمز الشراء المرسل عبر الشبكة وضعه كمرجع عند الدفع.",
        createdAt: new Date().toISOString(),
        storeId: null,
      },
    ],
    cartItems: [],
  };
}
