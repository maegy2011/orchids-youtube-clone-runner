import { NextRequest, NextResponse } from 'next/server';
import { filterContent } from '@/lib/content-filter';

interface PlaylistVideo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  channelName: string;
  index: number;
}

interface PlaylistData {
  id: string;
  title: string;
  thumbnail: string;
  channelName: string;
  channelId: string;
  videoCount: string;
  description: string;
  videos: PlaylistVideo[];
}

async function fetchPlaylistData(playlistId: string): Promise<PlaylistData> {
  const response = await fetch(`https://www.youtube.com/playlist?list=${playlistId}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch playlist: ${response.status}`);
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
  
  return extractPlaylistData(jsonData, playlistId);
}

function extractPlaylistData(data: Record<string, unknown>, playlistId: string): PlaylistData {
  const playlistData: PlaylistData = {
    id: playlistId,
    title: '',
    thumbnail: '',
    channelName: '',
    channelId: '',
    videoCount: '',
    description: '',
    videos: [],
  };

  const seenIds = new Set<string>();

  function findData(obj: unknown): void {
    if (!obj || typeof obj !== 'object') return;
    
    if (Array.isArray(obj)) {
      obj.forEach(findData);
      return;
    }
    
    const record = obj as Record<string, unknown>;

    if (record.playlistSidebarPrimaryInfoRenderer) {
      const info = record.playlistSidebarPrimaryInfoRenderer as Record<string, unknown>;
      const titleRuns = (info.title as Record<string, unknown>)?.runs as Array<Record<string, unknown>>;
      playlistData.title = titleRuns?.[0]?.text as string || '';
      
      const thumbnailRenderer = info.thumbnailRenderer as Record<string, unknown>;
      const playlistThumbs = (thumbnailRenderer?.playlistVideoThumbnailRenderer as Record<string, unknown>)?.thumbnail as Record<string, unknown>;
      const thumbs = playlistThumbs?.thumbnails as Array<Record<string, unknown>>;
      playlistData.thumbnail = thumbs?.slice(-1)[0]?.url as string || '';
      
      const statsRuns = (info.stats as Array<Record<string, unknown>>)?.[0]?.runs as Array<Record<string, unknown>>;
      playlistData.videoCount = statsRuns?.[0]?.text as string || '';
      
      const descRuns = (info.description as Record<string, unknown>)?.runs as Array<Record<string, unknown>>;
      playlistData.description = descRuns?.map(r => r.text).join('') as string || '';
    }

    if (record.playlistSidebarSecondaryInfoRenderer) {
      const secondary = record.playlistSidebarSecondaryInfoRenderer as Record<string, unknown>;
      const ownerRenderer = secondary.videoOwner as Record<string, unknown>;
      const ownerRuns = (ownerRenderer?.videoOwnerRenderer as Record<string, unknown>)?.title?.runs as Array<Record<string, unknown>>;
      playlistData.channelName = ownerRuns?.[0]?.text as string || '';
      
      const navEndpoint = ownerRuns?.[0]?.navigationEndpoint as Record<string, unknown>;
      const browseEndpoint = navEndpoint?.browseEndpoint as Record<string, unknown>;
      playlistData.channelId = browseEndpoint?.browseId as string || '';
    }

    const vr = record.playlistVideoRenderer as Record<string, unknown>;
    if (vr) {
      const videoId = vr.videoId as string;
      if (videoId && !seenIds.has(videoId)) {
        seenIds.add(videoId);
        
        const titleRuns = (vr.title as Record<string, unknown>)?.runs as Array<Record<string, unknown>>;
        const title = titleRuns?.[0]?.text as string || '';
        
        const thumbnails = (vr.thumbnail as Record<string, unknown>)?.thumbnails as Array<Record<string, unknown>>;
        let thumbnail = thumbnails?.slice(-1)[0]?.url as string || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        if (thumbnail.startsWith('//')) thumbnail = `https:${thumbnail}`;
        
        const lengthText = vr.lengthText as Record<string, unknown>;
        const duration = lengthText?.simpleText as string || '';
        
        const shortBylineRuns = (vr.shortBylineText as Record<string, unknown>)?.runs as Array<Record<string, unknown>>;
        const channelName = shortBylineRuns?.[0]?.text as string || '';
        
        const indexText = vr.index as Record<string, unknown>;
        const index = parseInt(indexText?.simpleText as string || '0', 10);
        
        const filterResult = filterContent(videoId, 'video', title, '', []);
        if (filterResult.allowed) {
          playlistData.videos.push({
            id: videoId,
            title,
            thumbnail,
            duration,
            channelName,
            index,
          });
        }
      }
    }
    
    Object.values(record).forEach(findData);
  }
  
  findData(data);
  playlistData.videos.sort((a, b) => a.index - b.index);
  return playlistData;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const playlistData = await fetchPlaylistData(id);
    
    return NextResponse.json(playlistData, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    console.error('Playlist API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch playlist' },
      { status: 500 }
    );
  }
}
