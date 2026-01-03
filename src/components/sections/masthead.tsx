"use client";

import React from 'react';
import { Menu, Search, Mic, MoreVertical, CircleUserRound, StickyNote, Shield, Home, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

interface MastheadProps {
  onSearch?: (query: string) => void;
  onMenuClick?: () => void;
}

const Masthead = ({ onSearch, onMenuClick }: MastheadProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showMobileSearch, setShowMobileSearch] = React.useState(false);

  const isHomePage = pathname === '/';
  const isWatchPage = pathname?.startsWith('/watch');
  const isNotesPage = pathname === '/notes';
  const isAdminPage = pathname?.startsWith('/admin');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (onSearch) {
        onSearch(searchQuery.trim());
      } else {
        router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
    setShowMobileSearch(false);
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  if (showMobileSearch) {
    return (
      <header className="fixed top-0 left-0 right-0 z-[2020] flex items-center h-[56px] px-2 bg-white select-none" dir="rtl">
        <button
          onClick={() => setShowMobileSearch(false)}
          className="p-2 rounded-full hover:bg-[#f2f2f2] transition-colors"
        >
          <ArrowRight size={24} className="text-[#0f0f0f]" />
        </button>
        <form onSubmit={handleSearch} className="flex-1 flex items-center">
          <input
            type="text"
            placeholder="بحث في يوتيوب..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 bg-transparent border-none outline-none text-[16px] text-right"
            autoFocus
            dir="rtl"
          />
          <button type="submit" className="p-2">
            <Search size={24} className="text-[#606060]" />
          </button>
        </form>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-[2020] flex items-center justify-between h-[56px] px-2 sm:px-4 bg-white select-none border-b border-[#f0f0f0]" dir="rtl">
      <div className="flex items-center">
        {(isWatchPage || isNotesPage || isAdminPage) && (
          <button
            className="p-2 ml-1 rounded-full hover:bg-[#f2f2f2] transition-colors duration-200 active:bg-[#e5e5e5]"
            aria-label="رجوع"
            onClick={handleGoBack}
          >
            <ArrowRight size={24} strokeWidth={1.5} className="text-[#0f0f0f]" />
          </button>
        )}
        
        <button
          className="p-2 ml-1 sm:ml-2 rounded-full hover:bg-[#f2f2f2] transition-colors duration-200 active:bg-[#e5e5e5]"
          aria-label="القائمة"
          onClick={onMenuClick}
        >
          <Menu size={24} strokeWidth={1.5} className="text-[#0f0f0f]" />
        </button>

        <Link href="/" className="flex items-center" aria-label="الصفحة الرئيسية">
          <div className="relative flex items-center pl-1">
            <svg width="28" height="20" viewBox="0 0 28 20" className="sm:hidden">
              <path
                d="M27.9727 3.12324C27.6435 1.89323 26.6768 0.926623 25.4468 0.597366C23.2197 0 14.285 0 14.285 0C14.285 0 5.35042 0 3.12324 0.597366C1.89323 0.926623 0.926623 1.89323 0.597366 3.12324C0 5.35042 0 10 0 10C0 10 0 14.6496 0.597366 16.8768C0.926623 18.1068 1.89323 19.0734 3.12324 19.4026C5.35042 20 14.285 20 14.285 20C14.285 20 23.2197 20 25.4468 19.4026C26.6768 19.0734 27.6435 18.1068 27.9727 16.8768C28.5701 14.6496 28.5701 10 28.5701 10C28.5701 10 28.5701 5.35042 27.9727 3.12324Z"
                fill="#FF0000"
              />
              <path d="M11.4253 14.2854L18.8477 10.0004L11.4253 5.71533V14.2854Z" fill="white" />
            </svg>
            <svg width="90" height="20" viewBox="0 0 90 20" preserveAspectRatio="xMidYMid meet" className="hidden sm:block">
              <g>
                <path
                  d="M27.9727 3.12324C27.6435 1.89323 26.6768 0.926623 25.4468 0.597366C23.2197 0 14.285 0 14.285 0C14.285 0 5.35042 0 3.12324 0.597366C1.89323 0.926623 0.926623 1.89323 0.597366 3.12324C0 5.35042 0 10 0 10C0 10 0 14.6496 0.597366 16.8768C0.926623 18.1068 1.89323 19.0734 3.12324 19.4026C5.35042 20 14.285 20 14.285 20C14.285 20 23.2197 20 25.4468 19.4026C26.6768 19.0734 27.6435 18.1068 27.9727 16.8768C28.5701 14.6496 28.5701 10 28.5701 10C28.5701 10 28.5701 5.35042 27.9727 3.12324Z"
                  fill="#FF0000"
                />
                <path d="M11.4253 14.2854L18.8477 10.0004L11.4253 5.71533V14.2854Z" fill="white" />
              </g>
            </svg>
            <span className="text-[#0f0f0f] text-[18px] sm:text-[20px] font-bold mr-1 hidden sm:inline">يوتيوب</span>
          </div>
        </Link>
      </div>

      <form onSubmit={handleSearch} className="hidden md:flex flex-grow justify-center max-w-[720px] px-4 lg:px-8">
        <div className="flex flex-grow max-w-[640px]">
          <div className="flex flex-grow items-center h-[40px] px-4 py-0 bg-white border border-[#cccccc] border-l-0 rounded-r-[40px] shadow-inner focus-within:border-[#065fd4] focus-within:mr-0 group">
            <input
              type="text"
              placeholder="بحث في يوتيوب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-[16px] font-roboto font-normal placeholder-[#606060] text-[#0f0f0f] text-right"
              dir="rtl"
            />
          </div>
          <button
            type="submit"
            className="flex items-center justify-center w-[64px] h-[40px] bg-[#f8f8f8] border border-[#cccccc] rounded-l-[40px] hover:bg-[#f2f2f2] hover:shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-colors duration-200"
            aria-label="بحث"
          >
            <Search size={20} strokeWidth={1.5} className="text-[#0f0f0f]" />
          </button>
        </div>

        <button
          type="button"
          className="mr-4 hidden lg:flex items-center justify-center w-[40px] h-[40px] bg-[#f2f2f2] rounded-full hover:bg-[#e5e5e5] transition-colors duration-200"
          aria-label="البحث بالصوت"
        >
          <Mic size={24} strokeWidth={1.5} className="text-[#0f0f0f]" />
        </button>
      </form>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setShowMobileSearch(true)}
          className="md:hidden p-2 rounded-full hover:bg-[#f2f2f2] transition-colors duration-200"
          aria-label="بحث"
        >
          <Search size={24} strokeWidth={1.5} className="text-[#0f0f0f]" />
        </button>

        {!isHomePage && (
          <Link
            href="/"
            className="p-2 rounded-full hover:bg-[#f2f2f2] transition-colors duration-200 active:bg-[#e5e5e5]"
            aria-label="الرئيسية"
            title="الرئيسية"
          >
            <Home size={24} strokeWidth={1.5} className="text-[#0f0f0f]" />
          </Link>
        )}

        <Link
          href="/notes"
          className={`p-2 rounded-full hover:bg-[#f2f2f2] transition-colors duration-200 active:bg-[#e5e5e5] ${isNotesPage ? 'bg-[#f2f2f2]' : ''}`}
          aria-label="ملاحظاتي"
          title="ملاحظاتي"
        >
          <StickyNote size={24} strokeWidth={1.5} className={isNotesPage ? 'text-red-600' : 'text-[#0f0f0f]'} />
        </Link>

        <Link
          href="/admin/filter"
          className={`p-2 rounded-full hover:bg-[#f2f2f2] transition-colors duration-200 active:bg-[#e5e5e5] ${isAdminPage ? 'bg-[#f2f2f2]' : ''}`}
          aria-label="إدارة التصفية"
          title="إدارة التصفية"
        >
          <Shield size={24} strokeWidth={1.5} className={isAdminPage ? 'text-red-600' : 'text-[#0f0f0f]'} />
        </Link>

        <button
          className="hidden sm:block p-2 rounded-full hover:bg-[#f2f2f2] transition-colors duration-200 active:bg-[#e5e5e5]"
          aria-label="الإعدادات"
        >
          <MoreVertical size={24} strokeWidth={1.5} className="text-[#0f0f0f]" />
        </button>

        <a
          href="#"
          className="hidden sm:flex items-center h-[36px] px-3 border border-[#e5e5e5] rounded-full hover:bg-[#def1ff] hover:border-transparent transition-colors duration-200"
        >
          <span className="text-[#065fd4] text-[14px] font-medium whitespace-nowrap">
            تسجيل الدخول
          </span>
          <div className="mr-2">
            <CircleUserRound size={24} strokeWidth={1.2} className="text-[#065fd4]" />
          </div>
        </a>

        <a
          href="#"
          className="sm:hidden p-2"
        >
          <CircleUserRound size={24} strokeWidth={1.5} className="text-[#065fd4]" />
        </a>
      </div>
    </header>
  );
};

export default Masthead;
