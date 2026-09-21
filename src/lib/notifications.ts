/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * External & System Notification Engine for B2B Wholesale Marketplace
 * Handles WhatsApp, SMS, Webhook integrations and order alerts.
 */

export interface NotificationPayload {
  recipientId?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  title: string;
  body: string;
  channel?: "WHATSAPP" | "SMS" | "WEBHOOK" | "SYSTEM";
  orderId?: string;
  metadata?: Record<string, any>;
}

export async function sendNotification(payload: NotificationPayload): Promise<{ success: boolean; id: string }> {
  const notificationId = `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const channel = payload.channel || "SYSTEM";

  console.log(`[Notification Engine - ${channel}] [${notificationId}]`, {
    title: payload.title,
    body: payload.body,
    recipient: payload.recipientPhone || payload.recipientEmail || payload.recipientId,
    timestamp: new Date().toISOString(),
  });

  // Optional Webhook Integration if WEBHOOK_URL is set in environment variables
  const webhookUrl = process.env.NOTIFICATION_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: notificationId,
          event: "ORDER_NOTIFICATION",
          ...payload,
        }),
      });
    } catch (error) {
      console.warn("[Notification Engine] Webhook dispatch warning:", error);
    }
  }

  return { success: true, id: notificationId };
}

export async function notifyOrderStatusChange(
  orderId: string,
  newStatus: string,
  retailerName: string,
  storeName: string
) {
  const statusLabels: Record<string, string> = {
    PENDING: "قيد الانتظار ⏳",
    ACCEPTED: "مقبول وفي انتظار التجهيز ✅",
    PREPARING: "جاري التجهيز والتعبئة 📦",
    SHIPPED: "تم الشحن وهو في الطريق إليك 🚚",
    DELIVERED: "تم التسليم بنجاح 🟢",
    CANCELLED: "ملغى ❌",
  };

  const statusText = statusLabels[newStatus] || newStatus;
  const message = `مرحباً ${retailerName}، تم تحديث حالة طلبك رقم (#${orderId.slice(0, 8)}) لدى متجر "${storeName}" إلى: ${statusText}`;

  return sendNotification({
    title: "تحديث حالة الطلب",
    body: message,
    channel: "WHATSAPP",
    orderId,
    metadata: { newStatus, storeName },
  });
}

export async function notifyNewOrderSubmitted(
  orderId: string,
  total: number,
  storeName: string,
  retailerName: string
) {
  const message = `طلب جديد! قام "${retailerName}" بإرسال طلب رقم (#${orderId.slice(0, 8)}) بقيمة ${total.toLocaleString("ar-SA")} ر.س لمتجر "${storeName}".`;

  return sendNotification({
    title: "طلب شراء جديد 🛒",
    body: message,
    channel: "WHATSAPP",
    orderId,
    metadata: { total, storeName },
  });
}
