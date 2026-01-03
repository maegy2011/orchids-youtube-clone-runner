"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, Play, Trash2, Search, ArrowRight, X } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import Masthead from '@/components/sections/masthead';
import SidebarGuide from '@/components/sections/sidebar-guide';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function FavoritesPage() {
  const { getAllFavorites, removeFavorite, isLoaded } = useFavorites();
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const allFavorites = isLoaded ? getAllFavorites() : [];
  
  const filteredFavorites = allFavorites.filter(fav => 
    fav.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fav.channelName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f9f9f9]" dir="rtl">
      <Masthead onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <SidebarGuide isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="mr-0 lg:mr-[240px] pt-[56px] pb-12 px-4 md:px-8">
        <div className="max-w-[1400px] mx-auto">
          <div className="py-6">
            <div className="flex items-center gap-3 mb-6">
              <Heart className="w-8 h-8 text-red-600 fill-red-600" />
              <h1 className="text-2xl font-bold text-[#0f0f0f]">المفضلة</h1>
              <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-sm font-medium">
                {allFavorites.length}
              </span>
            </div>

            <div className="relative mb-6">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#606060]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="البحث في المفضلة..."
                className="w-full pr-12 pl-4 py-3 bg-white border border-[#e5e5e5] rounded-full text-sm focus:outline-none focus:border-red-600 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-1 hover:bg-[#f2f2f2] rounded-full"
                >
                  <X size={16} className="text-[#606060]" />
                </button>
              )}
            </div>

            {!isLoaded ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-red-600 border-t-transparent"></div>
              </div>
            ) : allFavorites.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border border-[#e5e5e5]">
                <Heart className="w-16 h-16 text-[#ccc] mx-auto mb-4" />
                <h2 className="text-xl font-medium text-[#0f0f0f] mb-2">لا توجد فيديوهات مفضلة</h2>
                <p className="text-[#606060] mb-6">
                  أضف فيديوهاتك المفضلة بالضغط على أيقونة القلب
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors"
                >
                  <ArrowRight size={20} />
                  تصفح الفيديوهات
                </Link>
              </div>
            ) : filteredFavorites.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border border-[#e5e5e5]">
                <Search className="w-16 h-16 text-[#ccc] mx-auto mb-4" />
                <h2 className="text-xl font-medium text-[#0f0f0f] mb-2">لا توجد نتائج</h2>
                <p className="text-[#606060]">
                  لم يتم العثور على فيديوهات تطابق "{searchQuery}"
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredFavorites.map((favorite) => (
                  <div key={favorite.id} className="bg-white rounded-xl overflow-hidden border border-[#e5e5e5] group hover:shadow-lg transition-shadow">
                    <Link href={`/watch/${favorite.videoId}`} className="block relative">
                      <div className="relative aspect-video">
                        <img
                          src={favorite.thumbnail}
                          alt={favorite.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded">
                          {favorite.duration}
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                            <Play size={24} className="text-white fill-white mr-[-2px]" />
                          </div>
                        </div>
                      </div>
                    </Link>
                    
                    <div className="p-3">
                      <Link href={`/watch/${favorite.videoId}`}>
                        <h3 className="font-medium text-[#0f0f0f] line-clamp-2 mb-1 hover:text-red-600 transition-colors">
                          {favorite.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-[#606060] mb-2">{favorite.channelName}</p>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-[#e5e5e5]">
                        <span className="text-xs text-[#606060]">
                          أُضيف {formatDate(favorite.addedAt)}
                        </span>
                        <button
                          onClick={() => removeFavorite(favorite.videoId)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                          title="إزالة من المفضلة"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
