"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/hooks/use-user";
import Masthead from "@/components/sections/masthead";
import SidebarGuide from "@/components/sections/sidebar-guide";
import { Loader2, PlaySquare, Trash2, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Subscription {
  id: string;
  channelId: string;
  channelTitle: string;
  channelThumbnail: string | null;
  createdAt: string;
}

export default function SubscriptionsPage() {
  const { userId } = useUser();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchSubscriptions = async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/subscriptions?userId=${userId}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "فشل جلب الاشتراكات");
      }
      
      if (Array.isArray(data)) {
        setSubscriptions(data);
      } else {
        setSubscriptions([]);
      }
    } catch (err) {
      console.error("Error fetching subscriptions:", err);
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchSubscriptions();
    } else {
      setLoading(false);
    }
  }, [userId]);

  const unsubscribe = async (channelId: string) => {
    if (!userId) return;
    try {
      const response = await fetch("/api/subscriptions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, channelId }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "فشل إلغاء الاشتراك");
      }
      
      setSubscriptions((prev) => prev.filter((s) => s.channelId !== channelId));
    } catch (err) {
      console.error("Error unsubscribing:", err);
    }
  };

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Masthead onSearch={() => {}} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <SidebarGuide isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="mr-0 lg:mr-[240px] pt-[56px] px-4 md:px-6 lg:px-10 pb-12">
        <div className="max-w-[1200px] mx-auto mt-8">
          <div className="flex items-center gap-3 mb-8 border-b pb-4">
            <PlaySquare className="w-8 h-8 text-red-600" />
            <h1 className="text-2xl font-bold text-[#0f0f0f]">الاشتراكات</h1>
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
                onClick={fetchSubscriptions}
                className="px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[#606060] text-lg">لا توجد اشتراكات بعد.</p>
              <Link href="/" className="text-red-600 font-medium mt-4 inline-block hover:underline">
                استكشف الفيديوهات واشترك في قنواتك المفضلة
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {subscriptions.map((sub) => (
                <div key={sub.channelId} className="flex items-center justify-between p-4 border rounded-xl hover:bg-[#f9f9f9] transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-muted">
                      {sub.channelThumbnail ? (
                        <img src={sub.channelThumbnail} alt={sub.channelTitle} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-red-600 flex items-center justify-center text-white font-bold">
                          {sub.channelTitle.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#0f0f0f]">{sub.channelTitle}</h3>
                      <p className="text-sm text-[#606060]">قناة يوتيوب</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => unsubscribe(sub.channelId)}
                    className="p-2 text-[#606060] hover:text-red-600 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                    title="إلغاء الاشتراك"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
