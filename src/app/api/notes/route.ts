import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notes, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

async function ensureUser(userId: string) {
  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!existingUser) {
      await db.insert(users).values({ id: userId });
    }
  } catch (error) {
    console.error("Error ensuring user:", error);
    throw error;
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    const videoId = req.nextUrl.searchParams.get("videoId");
    
    if (!userId) {
      return NextResponse.json({ error: "معرف المستخدم مطلوب" }, { status: 400 });
    }

    let data;
    if (videoId) {
      data = await db.query.notes.findMany({
        where: and(eq(notes.userId, userId), eq(notes.videoId, videoId)),
        orderBy: [desc(notes.createdAt)],
      });
    } else {
      data = await db.query.notes.findMany({
        where: eq(notes.userId, userId),
        orderBy: [desc(notes.createdAt)],
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "فشل جلب الملاحظات" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, videoId, videoTitle, content, startTime, endTime } = body;
    
    if (!userId || !videoId || !content) {
      return NextResponse.json({ error: "الحقول المطلوبة ناقصة" }, { status: 400 });
    }

    await ensureUser(userId);

    const id = crypto.randomUUID();
    const now = new Date();

    await db.insert(notes).values({
      id,
      userId,
      videoId,
      videoTitle: videoTitle || "",
      content,
      startTime: startTime || 0,
      endTime: endTime || 0,
      createdAt: now,
      updatedAt: now,
    });

    const newNote = await db.query.notes.findFirst({
      where: eq(notes.id, id),
    });

    return NextResponse.json(newNote);
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: "فشل إنشاء الملاحظة" },
      { status: 500 }
    );
  }
}
