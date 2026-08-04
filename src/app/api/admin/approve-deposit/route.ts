import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "غير مصرح بالعملية." }, { status: 401 });
    }

    const { transactionId } = await request.json();
    if (!transactionId) {
      return NextResponse.json({ error: "معرف العملية مطلوب." }, { status: 400 });
    }

    // Update transaction to COMPLETED
    await db.transaction.update({
      where: { id: transactionId },
      data: { status: "COMPLETED" },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "حدث خطأ داخلي." }, { status: 500 });
  }
}
