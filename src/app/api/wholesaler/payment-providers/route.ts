import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "WHOLESALER") return NextResponse.json({ error: "غير مصرح." }, { status: 403 });

  const store = await db.store.findFirst({ where: { ownerId: user.id } });
  if (!store) return NextResponse.json({ providers: [] });

  const providers = await db.paymentProvider.findMany({ where: { storeId: store.id } });
  return NextResponse.json({ providers });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "WHOLESALER") return NextResponse.json({ error: "غير مصرح." }, { status: 403 });

  const store = await db.store.findFirst({ where: { ownerId: user.id } });
  if (!store) return NextResponse.json({ error: "لا يوجد متجر مرتبط." }, { status: 400 });

  const body = await request.json();
  const name = (body.name || "").toString().trim();
  const accountNumber = body.accountNumber ? body.accountNumber.toString().trim() : null;
  const instructions = body.instructions ? body.instructions.toString().trim() : null;

  if (!name) return NextResponse.json({ error: "اسم الموفر مطلوب." }, { status: 400 });

  const created = await db.paymentProvider.create({ data: { name, accountNumber, instructions, createdAt: new Date().toISOString(), storeId: store.id } });
  return NextResponse.json({ provider: created });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "WHOLESALER") return NextResponse.json({ error: "غير مصرح." }, { status: 403 });

  const store = await db.store.findFirst({ where: { ownerId: user.id } });
  if (!store) return NextResponse.json({ error: "لا يوجد متجر مرتبط." }, { status: 400 });

  const body = await request.json();
  const id = body.id;
  if (!id) return NextResponse.json({ error: "معرّف المزود مطلوب." }, { status: 400 });

  const data: Partial<{ name: string; accountNumber: string | null; instructions: string | null }> = {};
  if (body.name !== undefined) data.name = body.name.toString().trim();
  if (body.accountNumber !== undefined) data.accountNumber = body.accountNumber ? body.accountNumber.toString().trim() : null;
  if (body.instructions !== undefined) data.instructions = body.instructions ? body.instructions.toString().trim() : null;

  // ensure provider belongs to this store
  const existing = await db.paymentProvider.findUnique({ where: { id } });
  if (!existing || existing.storeId !== store.id) return NextResponse.json({ error: "مزود غير موجود أو ليس تابعاً لمتجرك." }, { status: 404 });

  const updated = await db.paymentProvider.update({ where: { id }, data });
  return NextResponse.json({ provider: updated });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "WHOLESALER") return NextResponse.json({ error: "غير مصرح." }, { status: 403 });

  const store = await db.store.findFirst({ where: { ownerId: user.id } });
  if (!store) return NextResponse.json({ error: "لا يوجد متجر مرتبط." }, { status: 400 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "معرّف المزود مطلوب." }, { status: 400 });

  const existing = await db.paymentProvider.findUnique({ where: { id } });
  if (!existing || existing.storeId !== store.id) return NextResponse.json({ error: "مزود غير موجود أو ليس تابعاً لمتجرك." }, { status: 404 });

  await db.paymentProvider.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
