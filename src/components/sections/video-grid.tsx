"use client";

import React, { useEffect, useState } from 'react';
import { MoreVertical, Loader2, Heart, X, CheckCircle2 } from 'lucide-react';
import { VideoItem } from '@/lib/types';
import Link from 'next/link';
import { useFavorites } from '@/hooks/useFavorites';
import { useHistory } from '@/hooks/use-history';

const VideoCard = ({ video, onDeny, watched }: { video: VideoItem; onDeny: (id: string) => void; watched: boolean }) => {
  const { toggleFavorite, isFavorite, denyVideo } = useFavorites();
  const [showActions, setShowActions] = useState(false);
  const favorited = isFavorite(video.id);

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite({
      videoId: video.id,
      title: video.title,
      thumbnail: video.thumbnail,
      channelName: video.channelName,
      duration: video.duration,
    });
  };

  const handleDeny = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    denyVideo(video.id);
    onDeny(video.id);
  };

  return (
    <div 
      className="flex flex-col group cursor-pointer relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <Link href={`/watch/${video.id}`} className="flex flex-col">
        <div className="relative aspect-video w-full overflow-hidden rounded-[12px] bg-muted mb-3">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="object-cover w-full h-full transition-transform duration-200 group-hover:scale-105"
          />
          <div className="absolute bottom-2 left-2 bg-black/80 text-white text-[12px] font-medium px-1.5 py-0.5 rounded-[4px]">
            {video.duration}
          </div>
          
            {favorited && (
              <div className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-full shadow-lg">
                <Heart size={14} className="fill-current" />
              </div>
            )}

            {watched && (
              <div className="absolute top-2 right-10 bg-black/60 text-white px-2 py-1 rounded-md flex items-center gap-1 backdrop-blur-sm border border-white/20">
                <CheckCircle2 size={12} className="text-green-400" />
                <span className="text-[10px] font-bold">تمت المشاهدة</span>
              </div>
            )}

          
          <div className={`absolute top-2 left-2 flex gap-1.5 transition-opacity duration-200 ${showActions ? 'opacity-100' : 'opacity-0'}`}>
            <button
              onClick={handleFavorite}
              className={`p-2 rounded-full shadow-lg transition-all ${
                favorited 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-white/90 text-gray-700 hover:bg-white hover:text-red-600'
              }`}
              title={favorited ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
            >
              <Heart size={16} className={favorited ? 'fill-current' : ''} />
            </button>
            <button
              onClick={handleDeny}
              className="p-2 bg-white/90 text-gray-700 rounded-full shadow-lg hover:bg-white hover:text-red-600 transition-all"
              title="إخفاء هذا الفيديو"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex gap-3 px-1">
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-9 h-9 overflow-hidden rounded-full bg-muted">
              {video.channelAvatar ? (
                <img
                  src={video.channelAvatar}
                  alt={video.channelName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold text-sm">
                  {video.channelName.charAt(0)}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col flex-1 min-w-0 pl-2">
            <h3 className="text-[#0f0f0f] text-[16px] font-medium leading-[22px] line-clamp-2 break-words mb-1 text-right">
              {video.title}
            </h3>
            <div className="flex flex-col text-right">
              <div className="flex items-center gap-1 justify-end group/author">
                <span className="text-[#606060] text-[14px] hover:text-[#0f0f0f] transition-colors leading-[20px]">
                  {video.channelName}
                </span>
                {video.isVerified && (
                  <svg className="w-[14px] h-[14px] text-[#606060]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zM10 17l-5-5 1.4-1.4 3.6 3.6 7.6-7.6L19 8l-9 9z" />
                  </svg>
                )}
              </div>
              <div className="text-[#606060] text-[14px] leading-[20px] whitespace-nowrap overflow-hidden text-ellipsis">
                {video.views} • {video.uploadedAt}
              </div>
            </div>
          </div>

          <button 
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-fit -ml-2"
            onClick={(e) => e.preventDefault()}
          >
            <MoreVertical className="w-5 h-5 text-[#0f0f0f]" />
          </button>
        </div>
      </Link>
    </div>
  );
};

const VideoGrid = ({ searchQuery }: { searchQuery?: string }) => {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isDenied, isLoaded: favoritesLoaded } = useFavorites();

  const { isWatched, loading: historyLoading } = useHistory();

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      setError(null);
      try {
        const query = searchQuery || 'تعلم البرمجة';
        const response = await fetch(`/api/videos/search?q=${encodeURIComponent(query)}&limit=24`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'فشل جلب الفيديوهات');
        }
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        setVideos(data.videos || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [searchQuery]);

  const handleDeny = (videoId: string) => {
    setVideos(prev => prev.filter(v => v.id !== videoId));
  };

  const filteredVideos = favoritesLoaded 
    ? videos.filter(video => !isDenied(video.id))
    : videos;

  if (loading) {
    return (
      <section className="w-full h-full bg-white pt-6 pb-12 px-4 md:px-6 lg:px-10">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-10 h-10 animate-spin text-red-600" />
          <span className="mr-3 text-lg text-[#606060]">جاري تحميل الفيديوهات...</span>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full h-full bg-white pt-6 pb-12 px-4 md:px-6 lg:px-10">
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
          >
            إعادة المحاولة
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full h-full bg-white pt-6 pb-12 px-4 md:px-6 lg:px-10 overflow-x-hidden">
      <div className="max-w-[1800px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-10">
        {filteredVideos.map((video) => (
          <VideoCard 
            key={video.id} 
            video={video} 
            onDeny={handleDeny} 
            watched={isWatched(video.id)} 
          />
        ))}
      </div>
      {filteredVideos.length === 0 && (
        <div className="text-center py-12 text-[#606060]">
          لا توجد فيديوهات
        </div>
      )}
    </section>
  );
};

export default VideoGrid;
