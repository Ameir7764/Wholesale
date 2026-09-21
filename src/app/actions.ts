/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { login, logout, getCurrentUser, type UserSession } from "@/lib/auth";
import { hashPassword } from "@/lib/crypto";
import { notifyOrderStatusChange, notifyNewOrderSubmitted } from "@/lib/notifications";

type Role = "ADMIN" | "WHOLESALER" | "RETAILER";
type PaymentMethod = "CASH_ON_DELIVERY" | "WALLET" | "BANK_TRANSFER" | "MOBILE_WALLET";
type OrderStatus = "PENDING" | "ACCEPTED" | "PREPARING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

const paymentMethods: PaymentMethod[] = ["CASH_ON_DELIVERY", "WALLET", "BANK_TRANSFER", "MOBILE_WALLET"];
const orderStatuses: OrderStatus[] = ["PENDING", "ACCEPTED", "PREPARING", "SHIPPED", "DELIVERED", "CANCELLED"];

const allowedStatusTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["PREPARING", "CANCELLED"],
  PREPARING: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

interface ProductFormData {
  name: string;
  description?: string;
  sku?: string;
  price: number;
  moq: number;
  packingUnit: string;
  stock: number;
  imageUrl?: string | null;
  categoryId?: string | null;
}

function isPaymentMethod(value: string): value is PaymentMethod {
  return paymentMethods.includes(value as PaymentMethod);
}

function isOrderStatus(value: string): value is OrderStatus {
  return orderStatuses.includes(value as OrderStatus);
}

function assertRole(user: UserSession | null, role: Role) {
  if (!user || user.role !== role || !user.isApproved) {
    throw new Error("غير مصرح بتنفيذ هذه العملية.");
  }
  return user;
}

function assertAuthenticated(user: UserSession | null) {
  if (!user || !user.isApproved) {
    throw new Error("غير مصرح بتنفيذ هذه العملية.");
  }
  return user;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function requirePositiveNumber(value: number, fieldName: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${fieldName} يجب أن يكون رقماً أكبر من صفر.`);
  }
}

function sanitizeProductPayload(formData: ProductFormData) {
  const name = formData.name?.trim();
  const packingUnit = formData.packingUnit?.trim();
  const price = Number(formData.price);
  const moq = Math.trunc(Number(formData.moq));
  const stock = Math.trunc(Number(formData.stock));

  if (!name || name.length < 2) {
    throw new Error("اسم الصنف مطلوب ويجب أن يكون واضحاً.");
  }
  if (!packingUnit) {
    throw new Error("وحدة التغليف مطلوبة.");
  }
  requirePositiveNumber(price, "سعر الجملة");
  if (!Number.isInteger(moq) || moq < 1) {
    throw new Error("الحد الأدنى للطلب يجب أن يكون رقماً صحيحاً أكبر من صفر.");
  }
  if (!Number.isInteger(stock) || stock < 0) {
    throw new Error("المخزون يجب أن يكون رقماً صحيحاً لا يقل عن صفر.");
  }

  return {
    name,
    description: formData.description?.trim() || null,
    sku: formData.sku?.trim() || null,
    price,
    moq,
    packingUnit,
    stock,
    imageUrl: formData.imageUrl?.trim() || null,
    categoryId: formData.categoryId || null,
  };
}

async function getWalletBalance(client: any, userId: string) {
  const transactions = await client.transaction.findMany({
    where: { userId },
  });

  return transactions.reduce((balance: number, tx: any) => {
    if (tx.status !== "COMPLETED") return balance;
    if (tx.type === "DEPOSIT" || tx.type === "REFUND") return balance + tx.amount;
    if (tx.type === "PAYMENT" || tx.type === "WITHDRAWAL") return balance - tx.amount;
    return balance;
  }, 0);
}

async function runInTransaction<T>(callback: (client: any) => Promise<T>) {
  if (typeof db.$transaction === "function") {
    return db.$transaction(callback);
  }

  return callback(db);
}

async function updatePaymentTransactions(client: any, orderId: string, status: string) {
  const transactions = await client.transaction.findMany({
    where: { orderId },
  });

  await Promise.all(
    transactions
      .filter((tx: any) => tx.type === "PAYMENT")
      .map((tx: any) => client.transaction.update({ where: { id: tx.id }, data: { status } }))
  );
}

export async function authenticateUser(email: string, password?: string) {
  if (!email || !password) {
    throw new Error("الرجاء إدخال البريد الإلكتروني وكلمة المرور.");
  }

  const session = await login(normalizeEmail(email), password);
  if (!session) {
    throw new Error("بيانات الدخول غير صحيحة أو أن الحساب ما زال بانتظار موافقة الإدارة.");
  }

  if (session.role === "ADMIN") redirect("/admin/dashboard");
  if (session.role === "WHOLESALER") redirect("/wholesaler/dashboard");
  redirect("/retailer/marketplace");
}

export async function deauthenticateUser() {
  await logout();
  redirect("/");
}

export async function addProduct(formData: ProductFormData) {
  const user = assertRole(await getCurrentUser(), "WHOLESALER");
  const payload = sanitizeProductPayload(formData);

  const store = await db.store.findUnique({
    where: { ownerId: user.id },
  });

  if (!store) {
    throw new Error("لم يتم العثور على متجر مرتبط بهذا الحساب.");
  }

  await db.product.create({
    data: {
      ...payload,
      storeId: store.id,
    },
  });

  revalidatePath("/wholesaler/dashboard");
  revalidatePath("/retailer/marketplace");
}

export async function editProduct(id: string, formData: ProductFormData) {
  const user = assertRole(await getCurrentUser(), "WHOLESALER");
  const payload = sanitizeProductPayload(formData);

  const product = await db.product.findUnique({
    where: { id },
    include: { store: true },
  });

  if (!product || product.store.ownerId !== user.id) {
    throw new Error("الصنف غير موجود أو غير تابع لمتجرك.");
  }

  await db.product.update({
    where: { id },
    data: payload,
  });

  revalidatePath("/wholesaler/dashboard");
  revalidatePath("/retailer/marketplace");
}

export async function removeProduct(id: string) {
  const user = assertRole(await getCurrentUser(), "WHOLESALER");

  const product = await db.product.findUnique({
    where: { id },
    include: { store: true },
  });

  if (!product || product.store.ownerId !== user.id) {
    throw new Error("الصنف غير موجود أو غير تابع لمتجرك.");
  }

  await db.product.delete({
    where: { id },
  });

  revalidatePath("/wholesaler/dashboard");
  revalidatePath("/retailer/marketplace");
}

export async function changeOrderStatus(orderId: string, status: string) {
  const user = assertAuthenticated(await getCurrentUser());

  if (!isOrderStatus(status)) {
    throw new Error("حالة الطلب غير صحيحة.");
  }

  await runInTransaction(async (client) => {
    const order = await client.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order || !isOrderStatus(order.status)) {
      throw new Error("الطلب غير موجود.");
    }

    const currentStatus = order.status as OrderStatus;
    const targetStatus = status as OrderStatus;
    if (!allowedStatusTransitions[currentStatus].includes(targetStatus)) {
      throw new Error("لا يمكن نقل الطلب إلى هذه الحالة من وضعه الحالي.");
    }

    if (user.role === "WHOLESALER") {
      const store = await client.store.findUnique({ where: { ownerId: user.id } });
      const hasStoreItems = !!store && order.items.some((item: any) => item.product.storeId === store.id);
      if (!hasStoreItems) {
        throw new Error("لا يمكنك تعديل طلب لا يحتوي على أصناف من متجرك.");
      }
    } else if (user.role !== "ADMIN") {
      throw new Error("غير مصرح بتنفيذ هذه العملية.");
    }

    const updateData: Record<string, string> = { status };

    if (status === "CANCELLED") {
      updateData.paymentStatus = "FAILED";
      await Promise.all(
        order.items.map((item: any) =>
          client.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          })
        )
      );

      await updatePaymentTransactions(client, order.id, "REJECTED");

      if (order.paymentMethod === "WALLET" && order.paymentStatus === "COMPLETED") {
        await client.transaction.create({
          data: {
            userId: order.retailerId,
            orderId: order.id,
            amount: order.total,
            type: "REFUND",
            status: "COMPLETED",
            reference: `REF-${Date.now()}`,
          },
        });
      }
    }

    if (status === "DELIVERED" && order.paymentMethod === "CASH_ON_DELIVERY") {
      updateData.paymentStatus = "COMPLETED";
      await updatePaymentTransactions(client, order.id, "COMPLETED");
    }

    await client.order.update({
      where: { id: orderId },
      data: updateData,
    });
  });

  try {
    const updatedOrder = await db.order.findUnique({
      where: { id: orderId },
      include: { retailer: true, items: { include: { product: { include: { store: true } } } } },
    });
    if (updatedOrder) {
      const storeName = updatedOrder.items[0]?.product?.store?.name || "سوق الجملة الذكي";
      await notifyOrderStatusChange(orderId, status, updatedOrder.retailer.name, storeName);
    }
  } catch (e) {
    console.warn("Notification error:", e);
  }

  revalidatePath("/wholesaler/dashboard");
  revalidatePath("/retailer/marketplace");
  revalidatePath("/admin/dashboard");
}

export async function replyToOrder(orderId: string, message: string) {
  const user = assertRole(await getCurrentUser(), "WHOLESALER");
  const note = message?.trim();
  if (!note) {
    throw new Error("الرد لا يمكن أن يكون فارغاً.");
  }

  const store = await db.store.findUnique({ where: { ownerId: user.id } });
  if (!store) {
    throw new Error("لم يتم العثور على المتجر الخاص بك.");
  }

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: { product: true },
      },
    },
  });

  if (!order) {
    throw new Error("الطلب غير موجود.");
  }

  const hasStoreItems = order.items.some((item: any) => item.product.storeId === store.id);
  if (!hasStoreItems) {
    throw new Error("لا يمكنك الرد على طلب لا يحتوي على منتجات من متجرك.");
  }

  await db.order.update({
    where: { id: orderId },
    data: { sellerReply: note },
  });

  revalidatePath("/wholesaler/dashboard");
  revalidatePath("/retailer/marketplace");
}

export async function submitOrder(
  items: { productId: string; quantity: number }[],
  paymentMethod: string,
  providerId?: string | null,
  bankReference?: string,
  retailerNote?: string
) {
  const user = assertRole(await getCurrentUser(), "RETAILER");

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("السلة فارغة.");
  }
  if (!isPaymentMethod(paymentMethod)) {
    throw new Error("طريقة الدفع غير صحيحة.");
  }

  const quantities = new Map<string, number>();
  for (const item of items) {
    const productId = item.productId?.trim();
    const quantity = Math.trunc(Number(item.quantity));
    if (!productId || !Number.isInteger(quantity) || quantity < 1) {
      throw new Error("توجد كمية غير صحيحة داخل السلة.");
    }
    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  }

  const reference = bankReference?.trim();
  if ((paymentMethod === "BANK_TRANSFER" || paymentMethod === "MOBILE_WALLET") && !reference && !providerId) {
    throw new Error("رقم مرجع الحوالة مطلوب عند اختيار الدفع بتحويل مصرفي.");
  }

  await runInTransaction(async (client) => {
    const orderItems = [];
    let total = 0;

    for (const [productId, quantity] of quantities.entries()) {
      const product = await client.product.findUnique({
        where: { id: productId },
        include: { store: true },
      });

      if (!product || !product.store?.isVerified) {
        throw new Error("أحد الأصناف غير متاح حالياً.");
      }
      if (quantity < product.moq) {
        throw new Error(`الحد الأدنى لطلب ${product.name} هو ${product.moq} ${product.packingUnit}.`);
      }
      if (quantity > product.stock) {
        throw new Error(`الكمية المطلوبة من ${product.name} تتجاوز المخزون المتوفر.`);
      }

      total += product.price * quantity;
      orderItems.push({
        productId,
        quantity,
        price: product.price,
      });
    }

    const walletBalance = await getWalletBalance(client, user.id);
    if (paymentMethod === "WALLET" && walletBalance < total) {
      throw new Error("رصيد المحفظة غير كافٍ لإتمام الطلب.");
    }

    const order = await client.order.create({
      data: {
        retailerId: user.id,
        status: "PENDING",
        total,
        paymentMethod,
        paymentStatus: paymentMethod === "WALLET" ? "COMPLETED" : "PENDING",
        paymentProviderId: providerId || null,
        retailerNote: retailerNote?.trim() || null,
        items: {
          create: orderItems,
        },
      },
    });

    await client.transaction.create({
      data: {
        userId: user.id,
        orderId: order.id,
        amount: total,
        type: "PAYMENT",
        status: paymentMethod === "WALLET" ? "COMPLETED" : "PENDING",
        reference: paymentMethod === "WALLET" ? `WLT-${Date.now()}` : reference || `PM-${Date.now()}`,
        provider: providerId || null,
      },
    });

    await Promise.all(
      orderItems.map((item) =>
        client.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        })
      )
    );
    try {
      await notifyNewOrderSubmitted(order.id, total, "متجر الجملة", user.name);
    } catch (e) {
      console.warn("Notification dispatch warning:", e);
    }
  });

  revalidatePath("/retailer/marketplace");
  revalidatePath("/wholesaler/dashboard");
  revalidatePath("/admin/dashboard");
}

export async function addTransaction(amount: number, type: string, reference: string) {
  const user = assertRole(await getCurrentUser(), "RETAILER");
  const value = Number(amount);
  const cleanReference = reference?.trim();

  requirePositiveNumber(value, "مبلغ الإيداع");
  if (type !== "DEPOSIT") {
    throw new Error("نوع العملية غير مسموح به من هذه الواجهة.");
  }
  if (!cleanReference || cleanReference.length < 4) {
    throw new Error("رقم مرجع الحوالة مطلوب ويجب أن يكون واضحاً.");
  }

  await db.transaction.create({
    data: {
      userId: user.id,
      amount: value,
      type: "DEPOSIT",
      status: "PENDING",
      reference: cleanReference,
    },
  });

  revalidatePath("/retailer/marketplace");
  revalidatePath("/admin/dashboard");
}

export async function toggleStoreVerification(storeId: string, isVerified: boolean) {
  assertRole(await getCurrentUser(), "ADMIN");

  await db.store.update({
    where: { id: storeId },
    data: { isVerified },
  });

  revalidatePath("/admin/dashboard");
  revalidatePath("/retailer/marketplace");
}

export async function toggleUserApproval(userId: string, isApproved: boolean) {
  const admin = assertRole(await getCurrentUser(), "ADMIN");

  if (admin.id === userId) {
    throw new Error("لا يمكن للمدير تعطيل حسابه الحالي.");
  }

  const targetUser = await db.user.findUnique({ where: { id: userId } });
  if (!targetUser || targetUser.role === "ADMIN") {
    throw new Error("لا يمكن تعديل صلاحية هذا الحساب.");
  }

  await db.user.update({
    where: { id: userId },
    data: { isApproved },
  });

  revalidatePath("/admin/dashboard");
}

export async function registerUser(formData: {
  name: string;
  email: string;
  password: string;
  role: "WHOLESALER" | "RETAILER";
  storeName?: string;
}) {
  const name = formData.name?.trim();
  const email = normalizeEmail(formData.email || "");
  const password = formData.password || "";
  const role = formData.role;
  const storeName = formData.storeName?.trim();

  if (!name || !email || !password || !role) {
    throw new Error("جميع الحقول المطلوبة يجب تعبئتها.");
  }
  if (!["WHOLESALER", "RETAILER"].includes(role)) {
    throw new Error("نوع الحساب غير صحيح.");
  }
  if (password.length < 8) {
    throw new Error("كلمة المرور يجب أن تتكون من 8 أحرف على الأقل.");
  }
  if (role === "WHOLESALER" && !storeName) {
    throw new Error("اسم المتجر مطلوب لتجار الجملة.");
  }

  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error("البريد الإلكتروني مسجل بالفعل.");
  }

  const user = await db.user.create({
    data: {
      name,
      email,
      password: hashPassword(password),
      role,
      isApproved: false,
    },
  });

  if (role === "WHOLESALER" && storeName) {
    await db.store.create({
      data: {
        name: storeName,
        ownerId: user.id,
      },
    });
  }

  revalidatePath("/admin/dashboard");
  return { success: true };
}
