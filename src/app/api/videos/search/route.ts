import { NextRequest, NextResponse } from 'next/server';
import YouTube from 'youtube-sr';
import { filterContent, loadFilterConfig } from '@/lib/content-filter';

const CATEGORY_SEARCH_TERMS: Record<string, string[]> = {
  education: ['تعليم', 'شرح', 'درس', 'كورس'],
  islamic: ['إسلامي', 'خطبة', 'شيخ', 'محاضرة دينية'],
  quran: ['قرآن', 'تلاوة', 'تجويد'],
  programming: ['برمجة', 'تعلم البرمجة', 'كورس برمجة'],
  science: ['علوم', 'وثائقي علمي'],
  documentary: ['وثائقي', 'فيلم وثائقي'],
  kids: ['أطفال', 'تعليم أطفال', 'أناشيد أطفال'],
  language: ['تعلم اللغة', 'تعلم الإنجليزية'],
  history: ['تاريخ', 'وثائقي تاريخي'],
  health: ['صحة', 'طب', 'تمارين'],
  mathematics: ['رياضيات', 'حساب', 'جبر'],
  business: ['أعمال', 'تسويق', 'ريادة'],
  cooking: ['طبخ', 'وصفات', 'مطبخ'],
  crafts: ['حرف يدوية', 'diy', 'فنون'],
  nature: ['طبيعة', 'حيوانات', 'وثائقي طبيعة'],
};

function enhanceQueryForAllowedContent(query: string, allowedCategories: string[]): string[] {
  const queries: string[] = [query];
  
  const selectedCategories = allowedCategories
    .filter(cat => CATEGORY_SEARCH_TERMS[cat])
    .slice(0, 2);
  
  for (const category of selectedCategories) {
    const terms = CATEGORY_SEARCH_TERMS[category];
    if (terms && terms.length > 0) {
      const randomTerm = terms[Math.floor(Math.random() * terms.length)];
      queries.push(`${query} ${randomTerm}`);
    }
  }
  
  return queries.slice(0, 3);
}

async function searchWithRetry(query: string, limit: number, retries = 2): Promise<unknown[]> {
  for (let i = 0; i <= retries; i++) {
    try {
      const results = await YouTube.search(query, { limit, type: 'video' });
      if (results && Array.isArray(results)) {
        return results;
      }
    } catch (err) {
      if (i === retries) {
        console.error(`YouTube search failed after ${retries + 1} attempts:`, err);
        throw err;
      }
      await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
    }
  }
  return [];
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 50);

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ 
      error: 'يرجى إدخال كلمة للبحث',
      videos: [], 
      totalResults: 0 
    }, { status: 400 });
  }

    try {
      const config = loadFilterConfig();
      const searchQueries = config.defaultDeny 
        ? enhanceQueryForAllowedContent(query, config.allowedCategories)
        : [query];
      
      const allResults: Map<string, unknown> = new Map();
      let lastError: Error | null = null;
      
      for (const searchQuery of searchQueries) {
        try {
          const searchResults = await searchWithRetry(searchQuery, limit * 2);
          
          if (searchResults && Array.isArray(searchResults)) {
            for (const video of searchResults) {
              if (video && typeof video === 'object' && 'id' in video) {
                const v = video as { id?: string };
                if (v.id && !allResults.has(v.id)) {
                  allResults.set(v.id, video);
                }
              }
            }
          }
        } catch (err) {
          console.error(`Search query "${searchQuery}" failed:`, err);
          lastError = err instanceof Error ? err : new Error(String(err));
        }
      }
    
    if (allResults.size === 0) {
      if (lastError) {
        return NextResponse.json({ 
          error: 'حدث خطأ أثناء البحث. يرجى المحاولة لاحقاً.',
          videos: [], 
          totalResults: 0,
          filtered: true
        });
      }
      return NextResponse.json({ 
        videos: [], 
        totalResults: 0, 
        filtered: true,
        message: 'لم يتم العثور على نتائج'
      });
    }
    
    const filteredVideos = [];
    
    for (const videoItem of allResults.values()) {
      if (filteredVideos.length >= limit) break;
      
      const video = videoItem as { 
        id?: string; 
        title?: string; 
        description?: string; 
        channel?: { id?: string; name?: string; icon?: { url?: string }; verified?: boolean }; 
        thumbnail?: { url?: string }; 
        durationFormatted?: string; 
        views?: number; 
        uploadedAt?: string; 
        url?: string 
      };
      
      if (!video || typeof video !== 'object') continue;
      const videoId = video.id;
      if (!videoId) continue;
      
      try {
        const title = video.title || '';
        const description = video.description || '';
        const channelId = video.channel?.id;
        
        const filterResult = filterContent(
          videoId,
          'video',
          title,
          description,
          [],
          channelId
        );
        
        if (filterResult.allowed) {
          filteredVideos.push({
            id: videoId,
            title: title,
            thumbnail: video.thumbnail?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
            duration: video.durationFormatted || '0:00',
            views: video.views ? `${formatViews(video.views)} مشاهدة` : '0 مشاهدة',
            uploadedAt: video.uploadedAt || 'غير معروف',
            channelName: video.channel?.name || 'غير معروف',
            channelAvatar: video.channel?.icon?.url || '',
            channelId: channelId || '',
            isVerified: video.channel?.verified || false,
            url: video.url || `https://www.youtube.com/watch?v=${videoId}`,
            filterReason: filterResult.reason,
          });
        }
      } catch (innerError) {
        console.error(`Error processing video ${videoId}:`, innerError);
      }
    }

    return NextResponse.json({ 
      videos: filteredVideos, 
      totalResults: filteredVideos.length,
      filtered: true,
      query: query,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ 
      error: 'حدث خطأ أثناء البحث. يرجى المحاولة لاحقاً.', 
      videos: [], 
      totalResults: 0 
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
