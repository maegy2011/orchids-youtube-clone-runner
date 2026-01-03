import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { favorites, deniedVideos, users } from "@/lib/db/schema";
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
    const type = req.nextUrl.searchParams.get("type");
    
    if (!userId) {
      return NextResponse.json({ error: "معرف المستخدم مطلوب" }, { status: 400 });
    }

    if (type === "denied") {
      const data = await db.query.deniedVideos.findMany({
        where: eq(deniedVideos.userId, userId),
        orderBy: [desc(deniedVideos.createdAt)],
      });
      return NextResponse.json(data.map(d => d.videoId));
    }

    const data = await db.query.favorites.findMany({
      where: eq(favorites.userId, userId),
      orderBy: [desc(favorites.addedAt)],
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return NextResponse.json(
      { error: "فشل جلب المفضلات" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, videoId, title, thumbnail, channelName, duration, type } = body;
    
    if (!userId || !videoId) {
      return NextResponse.json({ error: "الحقول المطلوبة ناقصة" }, { status: 400 });
    }

    await ensureUser(userId);

    if (type === "deny") {
      const existing = await db.query.deniedVideos.findFirst({
        where: and(eq(deniedVideos.userId, userId), eq(deniedVideos.videoId, videoId)),
      });

      if (existing) {
        return NextResponse.json({ message: "محظور بالفعل" });
      }

      await db.insert(deniedVideos).values({
        userId,
        videoId,
      });

      await db.delete(favorites).where(
        and(eq(favorites.userId, userId), eq(favorites.videoId, videoId))
      );

      return NextResponse.json({ success: true });
    }

    const existing = await db.query.favorites.findFirst({
      where: and(eq(favorites.userId, userId), eq(favorites.videoId, videoId)),
    });

    if (existing) {
      return NextResponse.json({ message: "مضاف للمفضلة بالفعل" });
    }

    const id = crypto.randomUUID();

    await db.insert(favorites).values({
      id,
      userId,
      videoId,
      title: title || "",
      thumbnail,
      channelName: channelName || "",
      duration,
      addedAt: new Date(),
    });

    const newFavorite = await db.query.favorites.findFirst({
      where: eq(favorites.id, id),
    });

    return NextResponse.json(newFavorite);
  } catch (error) {
    console.error("Error creating favorite:", error);
    return NextResponse.json(
      { error: "فشل إضافة المفضلة" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, videoId, type } = body;
    
    if (!userId || !videoId) {
      return NextResponse.json({ error: "الحقول المطلوبة ناقصة" }, { status: 400 });
    }

    if (type === "deny") {
      await db.delete(deniedVideos).where(
        and(eq(deniedVideos.userId, userId), eq(deniedVideos.videoId, videoId))
      );
      return NextResponse.json({ success: true });
    }

    await db.delete(favorites).where(
      and(eq(favorites.userId, userId), eq(favorites.videoId, videoId))
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting favorite:", error);
    return NextResponse.json(
      { error: "فشل حذف المفضلة" },
      { status: 500 }
    );
  }
}
