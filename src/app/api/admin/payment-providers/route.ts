import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    throw new Error("غير مصرح.");
  }
  return user;
}

export async function GET() {
  try {
    await assertAdmin();
    const providers = await db.paymentProvider.findMany();
    return NextResponse.json({ providers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "غير مصرح." }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    await assertAdmin();
    const body = await request.json();
    const name = (body.name || "").toString().trim();
    const accountNumber = body.accountNumber ? body.accountNumber.toString().trim() : null;
    const instructions = body.instructions ? body.instructions.toString().trim() : null;

    if (!name) return NextResponse.json({ error: "اسم الموفر مطلوب." }, { status: 400 });

    const created = await db.paymentProvider.create({ data: { name, accountNumber, instructions, createdAt: new Date().toISOString() } });
    return NextResponse.json({ provider: created });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "غير مصرح." }, { status: 403 });
  }
}

export async function PUT(request: Request) {
  try {
    await assertAdmin();
    const body = await request.json();
    const id = body.id;
    if (!id) return NextResponse.json({ error: "معرّف المزود مطلوب." }, { status: 400 });

    const data: Partial<{ name: string; accountNumber: string | null; instructions: string | null }> = {};
    if (body.name !== undefined) data.name = body.name.toString().trim();
    if (body.accountNumber !== undefined) data.accountNumber = body.accountNumber ? body.accountNumber.toString().trim() : null;
    if (body.instructions !== undefined) data.instructions = body.instructions ? body.instructions.toString().trim() : null;

    const updated = await db.paymentProvider.update({ where: { id }, data });
    return NextResponse.json({ provider: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "غير مصرح." }, { status: 403 });
  }
}

export async function DELETE(request: Request) {
  try {
    await assertAdmin();
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "معرّف المزود مطلوب." }, { status: 400 });

    await db.paymentProvider.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "غير مصرح." }, { status: 403 });
  }
}
