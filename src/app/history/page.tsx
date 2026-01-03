"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import Masthead from "@/components/sections/masthead";
import SidebarGuide from "@/components/sections/sidebar-guide";
import { Loader2, Library, Clock, AlertCircle } from "lucide-react";
import Link from "next/link";

interface HistoryItem {
  id: string;
  videoId: string;
  videoTitle: string;
  videoThumbnail: string;
  watchedAt: string;
}

export default function HistoryPage() {
  const { userId } = useUser();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchHistory = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/history?userId=${userId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "فشل جلب سجل المشاهدة");
      }
      
      if (Array.isArray(data)) {
        setHistory(data);
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchHistory();
    } else {
      setLoading(false);
    }
  }, [userId]);

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Masthead onSearch={() => {}} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <SidebarGuide isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="mr-0 lg:mr-[240px] pt-[56px] px-4 md:px-6 lg:px-10 pb-12">
        <div className="max-w-[1000px] mx-auto mt-8">
          <div className="flex items-center gap-3 mb-8 border-b pb-4">
            <Library className="w-8 h-8 text-red-600" />
            <h1 className="text-2xl font-bold text-[#0f0f0f]">سجل المشاهدة</h1>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-red-600" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <p className="text-red-600 text-lg mb-4">{error}</p>
              <button 
                onClick={fetchHistory}
                className="px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[#606060] text-lg">سجل المشاهدة فارغ.</p>
              <Link href="/" className="text-red-600 font-medium mt-4 inline-block hover:underline">
                ابدأ بمشاهدة الفيديوهات
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <Link 
                  href={`/watch/${item.videoId}`} 
                  key={item.id}
                  className="flex flex-col sm:flex-row gap-4 p-3 rounded-xl hover:bg-[#f2f2f2] transition-colors group"
                >
                  <div className="relative w-full sm:w-[240px] aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                    <img 
                      src={item.videoThumbnail} 
                      alt={item.videoTitle} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] px-1 rounded flex items-center gap-1">
                      <Clock size={10} />
                      <span>{new Date(item.watchedAt).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <h3 className="font-bold text-[#0f0f0f] line-clamp-2 text-lg mb-1">{item.videoTitle}</h3>
                    <p className="text-sm text-[#606060] flex items-center gap-1">
                      <span>تمت المشاهدة في</span>
                      <span>{new Date(item.watchedAt).toLocaleString('ar-EG')}</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
