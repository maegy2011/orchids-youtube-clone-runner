import { NextRequest, NextResponse } from 'next/server';
import ytdl from '@distube/ytdl-core';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoId = searchParams.get('videoId');
  const type = searchParams.get('type') || 'video';
  const quality = searchParams.get('quality') || '720';
  
  if (!videoId) {
    return NextResponse.json({ error: 'معرف الفيديو مطلوب' }, { status: 400 });
  }

  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    const info = await ytdl.getInfo(videoUrl, {
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        },
      },
    });
    
    let format;
    
    if (type === 'audio') {
      const audioFormats = ytdl.filterFormats(info.formats, 'audioonly')
        .filter(f => f.url);
      const targetBitrate = parseInt(quality);
      format = audioFormats.find(f => (f.audioBitrate || 0) <= targetBitrate) || audioFormats[0];
    } else {
      const targetHeight = parseInt(quality);
      const videoFormats = info.formats
        .filter(f => f.hasVideo && f.hasAudio && f.url)
        .sort((a, b) => {
          const aHeight = parseInt(a.qualityLabel || '0');
          const bHeight = parseInt(b.qualityLabel || '0');
          return Math.abs(aHeight - targetHeight) - Math.abs(bHeight - targetHeight);
        });
      
      if (videoFormats.length > 0) {
        format = videoFormats[0];
      } else {
        const anyFormat = info.formats.filter(f => f.url && f.hasVideo);
        format = anyFormat[0];
      }
    }

    if (!format || !format.url) {
      return NextResponse.json({ 
        error: 'لم يتم العثور على رابط تحميل صالح. يرجى المحاولة لاحقاً.',
        debug: process.env.NODE_ENV === 'development' ? 'No valid format with URL found' : undefined
      }, { status: 404 });
    }

    const safeTitle = info.videoDetails.title
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 100);
    
    const extension = type === 'audio' ? (format.container || 'mp3') : (format.container || 'mp4');
    const fileName = `${safeTitle}.${extension}`;

    const response = await fetch(format.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.youtube.com/',
        'Origin': 'https://www.youtube.com',
      },
    });

    if (!response.ok) {
      console.error('YouTube stream response not ok:', response.status, response.statusText);
      return NextResponse.json({ 
        error: 'فشل الاتصال بخادم التحميل. يرجى استخدام خدمات التحميل الخارجية.',
        useExternal: true
      }, { status: 502 });
    }

    const contentLength = format.contentLength || response.headers.get('content-length');
    const contentType = type === 'audio' 
      ? 'audio/mpeg' 
      : `video/${format.container || 'mp4'}`;

    const headers = new Headers({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    });

    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }

    return new NextResponse(response.body, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Stream download error:', error);
    return NextResponse.json(
      { 
        error: 'فشل تحميل الملف. يرجى المحاولة لاحقاً.',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}
