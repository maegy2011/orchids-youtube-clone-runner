import { NextRequest, NextResponse } from 'next/server';
import { filterContent } from '@/lib/content-filter';

interface ChannelVideo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: string;
  postedAt: string;
}

interface ChannelData {
  id: string;
  name: string;
  avatar: string;
  banner: string;
  subscribers: string;
  videoCount: string;
  description: string;
  videos: ChannelVideo[];
}

async function fetchChannelData(channelId: string): Promise<ChannelData> {
  const response = await fetch(`https://www.youtube.com/channel/${channelId}/videos`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch channel: ${response.status}`);
  }

  const html = await response.text();
  
  const scriptStart = html.indexOf('var ytInitialData = ');
  if (scriptStart === -1) {
    throw new Error('Could not find ytInitialData');
  }
  
  const start = scriptStart + 'var ytInitialData = '.length;
  let depth = 0;
  let end = start;
  let inString = false;
  let escapeNext = false;
  
  for (let i = start; i < html.length && i < start + 2000000; i++) {
    const char = html[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"' && !escapeNext) {
      inString = !inString;
      continue;
    }
    
    if (!inString) {
      if (char === '{') depth++;
      if (char === '}') {
        depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }
  }
  
  const jsonStr = html.slice(start, end);
  const jsonData = JSON.parse(jsonStr);
  
  return extractChannelData(jsonData, channelId);
}

function extractChannelData(data: Record<string, unknown>, channelId: string): ChannelData {
  const channelData: ChannelData = {
    id: channelId,
    name: '',
    avatar: '',
    banner: '',
    subscribers: '',
    videoCount: '',
    description: '',
    videos: [],
  };

  function findData(obj: unknown): void {
    if (!obj || typeof obj !== 'object') return;
    
    if (Array.isArray(obj)) {
      obj.forEach(findData);
      return;
    }
    
    const record = obj as Record<string, unknown>;

    if (record.c4TabbedHeaderRenderer) {
      const header = record.c4TabbedHeaderRenderer as Record<string, unknown>;
      channelData.name = header.title as string || '';
      
      const avatarThumbs = (header.avatar as Record<string, unknown>)?.thumbnails as Array<Record<string, unknown>>;
      channelData.avatar = avatarThumbs?.slice(-1)[0]?.url as string || '';
      
      const bannerThumbs = (header.banner as Record<string, unknown>)?.thumbnails as Array<Record<string, unknown>>;
      channelData.banner = bannerThumbs?.slice(-1)[0]?.url as string || '';
      
      const subText = header.subscriberCountText as Record<string, unknown>;
      channelData.subscribers = subText?.simpleText as string || '';
      
      const videoText = header.videosCountText as Record<string, unknown>;
      const videoRuns = videoText?.runs as Array<Record<string, unknown>>;
      channelData.videoCount = videoRuns?.map(r => r.text).join('') as string || '';
    }

    if (record.channelAboutFullMetadataRenderer) {
      const about = record.channelAboutFullMetadataRenderer as Record<string, unknown>;
      const descText = about.description as Record<string, unknown>;
      channelData.description = descText?.simpleText as string || '';
    }

    const vr = record.richItemRenderer as Record<string, unknown>;
    if (vr) {
      const content = vr.content as Record<string, unknown>;
      const videoRenderer = content?.videoRenderer as Record<string, unknown>;
      
      if (videoRenderer) {
        const videoId = videoRenderer.videoId as string;
        if (videoId) {
          const titleRuns = (videoRenderer.title as Record<string, unknown>)?.runs as Array<Record<string, unknown>>;
          const title = titleRuns?.[0]?.text as string || '';
          
          const thumbnails = (videoRenderer.thumbnail as Record<string, unknown>)?.thumbnails as Array<Record<string, unknown>>;
          let thumbnail = thumbnails?.slice(-1)[0]?.url as string || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
          if (thumbnail.startsWith('//')) thumbnail = `https:${thumbnail}`;
          
          const lengthText = videoRenderer.lengthText as Record<string, unknown>;
          const duration = lengthText?.simpleText as string || '';
          
          const viewText = videoRenderer.viewCountText as Record<string, unknown>;
          const views = viewText?.simpleText as string || '';
          
          const publishedText = videoRenderer.publishedTimeText as Record<string, unknown>;
          const postedAt = publishedText?.simpleText as string || '';
          
          const filterResult = filterContent(videoId, 'video', title, '', []);
          if (filterResult.allowed) {
            channelData.videos.push({
              id: videoId,
              title,
              thumbnail,
              duration,
              views,
              postedAt,
            });
          }
        }
      }
    }
    
    Object.values(record).forEach(findData);
  }
  
  findData(data);
  return channelData;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const channelData = await fetchChannelData(id);
    
    return NextResponse.json(channelData, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    console.error('Channel API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch channel' },
      { status: 500 }
    );
  }
}
