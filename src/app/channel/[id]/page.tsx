"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Masthead from "@/components/sections/masthead";
import SidebarGuide from "@/components/sections/sidebar-guide";
import { Loader2, AlertCircle, Play, Users, Video } from "lucide-react";

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

export default function ChannelPage() {
  const params = useParams();
  const channelId = params.id as string;
  const [channel, setChannel] = useState<ChannelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchChannel = async () => {
      if (!channelId) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/channel/${channelId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || "فشل جلب بيانات القناة");
        }
        
        setChannel(data);
      } catch (err) {
        console.error("Error fetching channel:", err);
        setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
      } finally {
        setLoading(false);
      }
    };

    fetchChannel();
  }, [channelId]);

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Masthead onSearch={() => {}} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <SidebarGuide isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="mr-0 lg:mr-[240px] pt-[56px]">
        {loading ? (
          <div className="flex items-center justify-center py-32">
            <Loader2 className="w-12 h-12 animate-spin text-red-600" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-32 text-center px-4">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <p className="text-red-600 text-lg mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : channel ? (
          <>
            {channel.banner && (
              <div className="w-full h-[120px] md:h-[180px] lg:h-[220px] overflow-hidden">
                <img 
                  src={channel.banner} 
                  alt={`${channel.name} banner`}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="px-4 md:px-6 lg:px-10 py-6 border-b">
              <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                  {channel.avatar ? (
                    <img src={channel.avatar} alt={channel.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-red-600 flex items-center justify-center text-white text-4xl font-bold">
                      {channel.name.charAt(0)}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 text-center md:text-right">
                  <h1 className="text-2xl md:text-3xl font-bold text-[#0f0f0f] mb-2">{channel.name}</h1>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-[#606060] text-sm mb-3">
                    {channel.subscribers && (
                      <span className="flex items-center gap-1">
                        <Users size={16} />
                        {channel.subscribers}
                      </span>
                    )}
                    {channel.videoCount && (
                      <span className="flex items-center gap-1">
                        <Video size={16} />
                        {channel.videoCount}
                      </span>
                    )}
                  </div>
                  {channel.description && (
                    <p className="text-[#606060] text-sm line-clamp-2 max-w-2xl">{channel.description}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="px-4 md:px-6 lg:px-10 py-8">
              <div className="max-w-[1200px] mx-auto">
                <h2 className="text-xl font-bold text-[#0f0f0f] mb-6 flex items-center gap-2">
                  <Play size={24} className="text-red-600" />
                  فيديوهات القناة
                </h2>
                
                {channel.videos.length === 0 ? (
                  <p className="text-[#606060] text-center py-12">لا توجد فيديوهات متاحة</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {channel.videos.map((video) => (
                      <Link 
                        key={video.id} 
                        href={`/watch/${video.id}`}
                        className="group"
                      >
                        <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 mb-3">
                          <img 
                            src={video.thumbnail} 
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          {video.duration && (
                            <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                              {video.duration}
                            </div>
                          )}
                        </div>
                        <h3 className="font-medium text-[#0f0f0f] line-clamp-2 mb-1 group-hover:text-red-600 transition-colors">
                          {video.title}
                        </h3>
                        <div className="flex items-center gap-2 text-[#606060] text-xs">
                          {video.views && <span>{video.views}</span>}
                          {video.views && video.postedAt && <span>•</span>}
                          {video.postedAt && <span>{video.postedAt}</span>}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
