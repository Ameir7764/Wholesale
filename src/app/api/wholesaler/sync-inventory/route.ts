import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { storeId, products, secretToken } = await request.json();

    // Simple authentication check
    if (secretToken !== "erp_sync_secure_token_123") {
      return NextResponse.json({ error: "غير مصرح بالعملية. رمز التحقق غير صالح." }, { status: 401 });
    }

    if (!storeId || !products || !Array.isArray(products)) {
      return NextResponse.json({ error: "البيانات المرسلة غير مكتملة." }, { status: 400 });
    }

    // Verify store exists
    const store = await db.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return NextResponse.json({ error: "المتجر غير موجود." }, { status: 404 });
    }

    let updatedCount = 0;

    // Loop through each product and update its stock and price
    for (const item of products) {
      if (!item.sku) continue;

      // Find product by SKU and storeId
      const product = await db.product.findFirst({
        where: {
          sku: item.sku,
          storeId: store.id,
        },
      });

      if (product) {
        await db.product.update({
          where: { id: product.id },
          data: {
            stock: item.stock,
            ...(item.price !== undefined ? { price: item.price } : {}),
          },
        });
        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `تم تحديث مخزون ${updatedCount} من المنتجات بنجاح من نظام الـ ERP.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "حدث خطأ داخلي أثناء المزامنة." }, { status: 500 });
  }
}
