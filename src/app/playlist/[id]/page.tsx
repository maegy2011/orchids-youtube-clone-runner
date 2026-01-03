"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Masthead from "@/components/sections/masthead";
import SidebarGuide from "@/components/sections/sidebar-guide";
import { Loader2, AlertCircle, ListVideo, User } from "lucide-react";

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

export default function PlaylistPage() {
  const params = useParams();
  const playlistId = params.id as string;
  const [playlist, setPlaylist] = useState<PlaylistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchPlaylist = async () => {
      if (!playlistId) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/playlist/${playlistId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || "فشل جلب بيانات قائمة التشغيل");
        }
        
        setPlaylist(data);
      } catch (err) {
        console.error("Error fetching playlist:", err);
        setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylist();
  }, [playlistId]);

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Masthead onSearch={() => {}} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <SidebarGuide isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="mr-0 lg:mr-[240px] pt-[56px] px-4 md:px-6 lg:px-10 pb-12">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-12 h-12 animate-spin text-red-600" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <p className="text-red-600 text-lg mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : playlist ? (
          <div className="max-w-[1400px] mx-auto mt-8">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="lg:w-[360px] flex-shrink-0">
                <div className="bg-gradient-to-b from-red-600 to-red-800 rounded-2xl p-6 text-white sticky top-[80px]">
                  {playlist.thumbnail && (
                    <div className="aspect-video rounded-xl overflow-hidden mb-4 shadow-lg">
                      <img 
                        src={playlist.thumbnail} 
                        alt={playlist.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <h1 className="text-xl font-bold mb-3">{playlist.title}</h1>
                  
                  {playlist.channelName && (
                    <Link 
                      href={playlist.channelId ? `/channel/${playlist.channelId}` : '#'}
                      className="flex items-center gap-2 text-white/90 hover:text-white mb-3 transition-colors"
                    >
                      <User size={16} />
                      <span>{playlist.channelName}</span>
                    </Link>
                  )}
                  
                  <div className="flex items-center gap-2 text-white/80 text-sm mb-4">
                    <ListVideo size={16} />
                    <span>{playlist.videoCount || playlist.videos.length} فيديو</span>
                  </div>
                  
                  {playlist.description && (
                    <p className="text-white/70 text-sm line-clamp-4">{playlist.description}</p>
                  )}
                  
                  {playlist.videos.length > 0 && (
                    <Link
                      href={`/watch/${playlist.videos[0].id}?list=${playlistId}`}
                      className="mt-6 w-full bg-white text-red-600 font-bold py-3 px-6 rounded-full flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
                    >
                      <ListVideo size={20} />
                      تشغيل الكل
                    </Link>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-bold text-[#0f0f0f] mb-4 flex items-center gap-2">
                  <ListVideo size={20} className="text-red-600" />
                  الفيديوهات ({playlist.videos.length})
                </h2>
                
                {playlist.videos.length === 0 ? (
                  <p className="text-[#606060] text-center py-12">لا توجد فيديوهات في قائمة التشغيل</p>
                ) : (
                  <div className="space-y-3">
                    {playlist.videos.map((video, index) => (
                      <Link 
                        key={video.id} 
                        href={`/watch/${video.id}?list=${playlistId}`}
                        className="flex gap-4 p-3 rounded-xl hover:bg-gray-100 transition-colors group"
                      >
                        <div className="text-[#606060] text-sm w-6 flex-shrink-0 flex items-center justify-center">
                          {index + 1}
                        </div>
                        
                        <div className="relative w-40 aspect-video rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          <img 
                            src={video.thumbnail} 
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          {video.duration && (
                            <div className="absolute bottom-1 left-1 bg-black/80 text-white text-[10px] px-1 py-0.5 rounded">
                              {video.duration}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-[#0f0f0f] line-clamp-2 mb-1 group-hover:text-red-600 transition-colors">
                            {video.title}
                          </h3>
                          {video.channelName && (
                            <p className="text-[#606060] text-xs">{video.channelName}</p>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
