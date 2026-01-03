import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { userId, content, startTime, endTime } = body;
    
    if (!userId) {
      return NextResponse.json({ error: "معرف المستخدم مطلوب" }, { status: 400 });
    }

    const existing = await db.query.notes.findFirst({
      where: and(eq(notes.id, id), eq(notes.userId, userId)),
    });

    if (!existing) {
      return NextResponse.json({ error: "الملاحظة غير موجودة" }, { status: 404 });
    }

    await db.update(notes)
      .set({
        content: content ?? existing.content,
        startTime: startTime ?? existing.startTime,
        endTime: endTime ?? existing.endTime,
        updatedAt: new Date(),
      })
      .where(and(eq(notes.id, id), eq(notes.userId, userId)));

    const updated = await db.query.notes.findFirst({
      where: eq(notes.id, id),
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json(
      { error: "فشل تحديث الملاحظة" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = req.nextUrl.searchParams.get("userId");
    
    if (!userId) {
      return NextResponse.json({ error: "معرف المستخدم مطلوب" }, { status: 400 });
    }

    const existing = await db.query.notes.findFirst({
      where: and(eq(notes.id, id), eq(notes.userId, userId)),
    });

    if (!existing) {
      return NextResponse.json({ error: "الملاحظة غير موجودة" }, { status: 404 });
    }

    await db.delete(notes).where(and(eq(notes.id, id), eq(notes.userId, userId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json(
      { error: "فشل حذف الملاحظة" },
      { status: 500 }
    );
  }
}
