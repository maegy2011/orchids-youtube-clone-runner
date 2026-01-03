import { NextRequest, NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';

interface FormatInfo {
  itag: number;
  qualityLabel?: string;
  container: string;
  hasVideo: boolean;
  hasAudio: boolean;
  bitrate?: number;
  audioBitrate?: number;
  url: string;
  contentLength?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  'Video unavailable': 'الفيديو غير متاح أو تم حذفه',
  'Private video': 'هذا الفيديو خاص ولا يمكن تحميله',
  'Sign in to confirm your age': 'هذا الفيديو يتطلب تسجيل الدخول للتحقق من العمر',
  'Video is unavailable': 'الفيديو غير متاح في منطقتك',
  'default': 'حدث خطأ أثناء جلب معلومات الفيديو. يرجى المحاولة لاحقاً.',
};

function getErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  
  for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
    if (message.includes(key)) {
      return value;
    }
  }
  
  return ERROR_MESSAGES.default;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId, quality, type } = body;

    if (!videoId) {
      return NextResponse.json({ error: 'معرف الفيديو مطلوب' }, { status: 400 });
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    let info;
    try {
      info = await ytdl.getInfo(videoUrl);
    } catch (fetchError) {
      console.error('ytdl.getInfo error:', fetchError);
      return NextResponse.json({ 
        error: getErrorMessage(fetchError),
        details: process.env.NODE_ENV === 'development' ? String(fetchError) : undefined
      }, { status: 500 });
    }

    const formats = info.formats;
    let selectedFormat: FormatInfo | null = null;

    if (type === 'audio') {
      const audioFormats = formats
        .filter(f => f.hasAudio && !f.hasVideo)
        .sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0));
      
      const targetBitrate = parseInt(quality);
      selectedFormat = audioFormats.find(f => (f.audioBitrate || 0) <= targetBitrate) || audioFormats[0];
    } else {
      const targetHeight = parseInt(quality);
      
      const videoWithAudio = formats
        .filter(f => f.hasVideo && f.hasAudio)
        .sort((a, b) => {
          const aHeight = parseInt(a.qualityLabel || '0');
          const bHeight = parseInt(b.qualityLabel || '0');
          return Math.abs(aHeight - targetHeight) - Math.abs(bHeight - targetHeight);
        });
      
      if (videoWithAudio.length > 0) {
        selectedFormat = videoWithAudio[0];
      } else {
        const videoOnly = formats
          .filter(f => f.hasVideo)
          .sort((a, b) => {
            const aHeight = parseInt(a.qualityLabel || '0');
            const bHeight = parseInt(b.qualityLabel || '0');
            return Math.abs(aHeight - targetHeight) - Math.abs(bHeight - targetHeight);
          });
        selectedFormat = videoOnly[0];
      }
    }

    if (!selectedFormat || !selectedFormat.url) {
      return NextResponse.json({ 
        error: 'لم يتم العثور على صيغة مناسبة للتحميل. يرجى تجربة جودة مختلفة.',
      }, { status: 404 });
    }

    const actualQuality = type === 'audio' 
      ? `${selectedFormat.audioBitrate || 128}kbps`
      : selectedFormat.qualityLabel || `${quality}p`;

      const streamUrl = `/api/download/stream?videoId=${videoId}&type=${type}&quality=${quality}`;

      return NextResponse.json({ 
        url: streamUrl,
        videoId,
        quality: actualQuality,
        type,
        container: selectedFormat.container,
        fileSize: selectedFormat.contentLength 
          ? `${Math.round(parseInt(selectedFormat.contentLength) / 1024 / 1024)} MB`
          : 'غير معروف',
        title: info.videoDetails.title,
        message: 'تم إنشاء رابط التحميل بنجاح'
      });

  } catch (error) {
    console.error('Download API error:', error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoId = searchParams.get('videoId');
  
  if (!videoId) {
    return NextResponse.json({ error: 'معرف الفيديو مطلوب' }, { status: 400 });
  }

  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const info = await ytdl.getInfo(videoUrl);
    
    const videoFormats = info.formats
      .filter(f => f.hasVideo && f.hasAudio)
      .map(f => ({
        itag: f.itag,
        quality: f.qualityLabel,
        container: f.container,
        size: f.contentLength 
          ? `${Math.round(parseInt(f.contentLength) / 1024 / 1024)} MB`
          : 'غير معروف',
      }))
      .filter((f, i, arr) => arr.findIndex(x => x.quality === f.quality) === i);

    const audioFormats = info.formats
      .filter(f => f.hasAudio && !f.hasVideo)
      .map(f => ({
        itag: f.itag,
        quality: `${f.audioBitrate || 128}kbps`,
        container: f.container,
        size: f.contentLength 
          ? `${Math.round(parseInt(f.contentLength) / 1024 / 1024)} MB`
          : 'غير معروف',
      }))
      .filter((f, i, arr) => arr.findIndex(x => x.quality === f.quality) === i)
      .slice(0, 5);

    return NextResponse.json({
      title: info.videoDetails.title,
      duration: info.videoDetails.lengthSeconds,
      thumbnail: info.videoDetails.thumbnails[0]?.url,
      videoFormats,
      audioFormats,
    });
  } catch (error) {
    console.error('Get formats error:', error);
    return NextResponse.json({ 
      error: getErrorMessage(error) 
    }, { status: 500 });
  }
}
