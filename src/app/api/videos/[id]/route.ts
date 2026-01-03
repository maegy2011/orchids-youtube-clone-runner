import { NextRequest, NextResponse } from 'next/server';
import YouTube from 'youtube-sr';
import { filterContent } from '@/lib/content-filter';

const ERROR_MESSAGES: Record<string, string> = {
  'Video unavailable': 'الفيديو غير متاح أو تم حذفه',
  'Private video': 'هذا الفيديو خاص',
  'Sign in to confirm': 'هذا الفيديو يتطلب تسجيل الدخول',
  'Video is unavailable': 'الفيديو غير متاح في منطقتك',
  'This video is not available': 'هذا الفيديو غير متاح',
  'default': 'حدث خطأ أثناء جلب معلومات الفيديو. يرجى المحاولة لاحقاً.',
};

function getErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  
  for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
    if (key !== 'default' && message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  return ERROR_MESSAGES.default;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || id.length < 5) {
    return NextResponse.json({ 
      error: 'معرف الفيديو غير صالح',
      blocked: false 
    }, { status: 400 });
  }

  try {
    let video;
    try {
      video = await YouTube.getVideo(`https://www.youtube.com/watch?v=${id}`);
    } catch (fetchError) {
      console.error('YouTube.getVideo error:', fetchError);
      return NextResponse.json({ 
        error: getErrorMessage(fetchError),
        blocked: false
      }, { status: 500 });
    }
    
    if (!video) {
      return NextResponse.json({ 
        error: 'الفيديو غير موجود. قد يكون محذوفاً أو خاصاً.',
        blocked: false 
      }, { status: 404 });
    }

    const filterResult = filterContent(
      video.id || id,
      'video',
      video.title || '',
      video.description || '',
      video.tags || [],
      video.channel?.id
    );

    if (!filterResult.allowed) {
      return NextResponse.json({ 
        error: 'المحتوى غير مسموح به',
        reason: filterResult.reason,
        blocked: true
      }, { status: 403 });
    }

    const videoData = {
      id: video.id,
      title: video.title || '',
      description: video.description || '',
      thumbnail: video.thumbnail?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      duration: video.duration || 0,
      views: video.views ? `${formatViews(video.views)} مشاهدة` : 'غير معروف',
      likes: video.likes?.toString() || '0',
      uploadDate: video.uploadedAt || 'غير معروف',
      channelName: video.channel?.name || 'غير معروف',
      channelAvatar: video.channel?.icon?.url || '',
      channelId: video.channel?.id || '',
      channelSubscribers: video.channel?.subscribers || 'غير معروف',
      isVerified: video.channel?.verified || false,
      keywords: video.tags || [],
      category: 'غير معروف',
      embedUrl: `https://www.youtube-nocookie.com/embed/${video.id}`,
      filterReason: filterResult.reason,
    };

    return NextResponse.json(videoData);
  } catch (error) {
    console.error('Video info error:', error);
    return NextResponse.json({ 
      error: getErrorMessage(error),
      blocked: false 
    }, { status: 500 });
  }
}

function formatViews(views: number): string {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)} مليون`;
  } else if (views >= 1000) {
    return `${(views / 1000).toFixed(1)} ألف`;
  }
  return views.toString();
}
