import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

async function assertRetailer() {
  const user = await getCurrentUser();
  if (!user || user.role !== "RETAILER") {
    throw new Error("غير مصرح.");
  }
  return user;
}

export async function GET() {
  try {
    const user = await assertRetailer();
    const cartItems = await db.cartItem.findMany({
      where: { userId: user.id },
      include: { product: true },
    });

    return NextResponse.json({ items: cartItems.map((item: any) => ({
      productId: item.productId,
      quantity: item.quantity,
      product: item.product,
    })) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "غير مصرح." }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await assertRetailer();
    const body = await request.json();
    const items = Array.isArray(body.items) ? body.items : [];

    if (!items.length) {
      await db.cartItem.deleteMany({ where: { userId: user.id } });
      return NextResponse.json({ items: [] });
    }

    await db.cartItem.deleteMany({ where: { userId: user.id } });

    const createdItems = [];
    for (const item of items) {
      const productId = item.productId?.toString().trim();
      const quantity = Math.trunc(Number(item.quantity));
      if (!productId || !Number.isInteger(quantity) || quantity <= 0) {
        continue;
      }

      const stored = await db.cartItem.create({
        data: {
          userId: user.id,
          productId,
          quantity,
        },
      });
      createdItems.push(stored);
    }

    return NextResponse.json({ items: createdItems });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "غير مصرح." }, { status: 403 });
  }
}

export async function DELETE() {
  try {
    const user = await assertRetailer();
    await db.cartItem.deleteMany({ where: { userId: user.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "غير مصرح." }, { status: 403 });
  }
}
