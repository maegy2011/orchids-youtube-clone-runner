"use client";

import React from 'react';
import { Home, PlaySquare, Library, UserCircle, StickyNote, X, Heart, Download, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  href,
  isActive = false,
  onClick
}: { 
  icon: React.ElementType, 
  label: string, 
  href: string,
  isActive?: boolean,
  onClick?: () => void
}) => {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`
        flex items-center h-[40px] px-[12px] mx-[12px] cursor-pointer transition-colors duration-200
        rounded-[10px] group
        ${isActive ? 'bg-[#f2f2f2]' : 'bg-transparent hover:bg-[#f2f2f2]'}
      `}
    >
      <span 
        className={`
          flex-1 whitespace-nowrap overflow-hidden text-ellipsis text-right
          ${isActive ? 'font-medium text-[#0f0f0f]' : 'font-normal text-[#0f0f0f]'}
          text-[14px] leading-[20px] font-sans
        `}
      >
        {label}
      </span>
      <div className="flex items-center justify-center w-[24px] h-[24px] mr-[24px]">
        <Icon 
          className={`w-[24px] h-[24px] ${isActive ? 'text-[#0f0f0f] fill-[#0f0f0f]' : 'text-[#0f0f0f]'}`} 
          strokeWidth={isActive ? 2.5 : 2}
        />
      </div>
    </Link>
  );
};

const ShortsIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    preserveAspectRatio="xMidYMid meet" 
    focusable="false" 
    className={className}
    fill="currentColor"
  >
    <g>
      <path d="M10 14.65v-5.3L15 12l-5 2.65zM17.77 10.32l-1.2-.5L18 8.82a3.74 3.74 0 00-2.22-6.73 3.69 3.69 0 00-1.46.3L5.4 6.39a3.75 3.75 0 00-1.07 6.19l1.2.5L4 14.18a3.74 3.74 0 002.22 6.73 3.69 3.69 0 001.46-.3l8.92-4a3.75 3.75 0 001.07-6.19l-.9-.1z"></path>
    </g>
  </svg>
);

interface SidebarGuideProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const SidebarGuide = ({ isOpen = false, onClose }: SidebarGuideProps) => {
  const pathname = usePathname();

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside 
        className={`
          w-[240px] h-screen bg-white flex flex-col py-[12px] fixed right-0 top-0 pt-[56px] z-40 overflow-y-auto
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          lg:translate-x-0
        `}
        aria-label="التنقل"
        dir="rtl"
      >
        <button
          onClick={onClose}
          className="lg:hidden absolute top-[68px] left-3 p-2 rounded-full hover:bg-[#f2f2f2] transition-colors"
          aria-label="إغلاق القائمة"
        >
          <X size={20} className="text-[#606060]" />
        </button>

        <div className="flex flex-col gap-[4px] mt-2 lg:mt-0">
          <SidebarItem 
            icon={Home} 
            label="الرئيسية" 
            href="/"
            isActive={pathname === '/'} 
            onClick={onClose}
          />
          
          <SidebarItem 
            icon={ShortsIcon} 
            label="شورتس"
            href="/"
            onClick={onClose}
          />
          
            <SidebarItem 
              icon={PlaySquare} 
              label="الاشتراكات"
              href="/subscriptions"
              isActive={pathname === '/subscriptions'}
              onClick={onClose}
            />
          </div>

          <div className="h-[1px] bg-[#e5e5e5] my-[12px] mx-[12px]" />

          <div className="flex flex-col gap-[4px]">
              <SidebarItem 
                icon={UserCircle} 
                label="أنت"
                href="/"
                onClick={onClose}
              />
              
              <SidebarItem 
                icon={Heart} 
                label="المفضلة"
                href="/favorites"
                isActive={pathname === '/favorites'}
                onClick={onClose}
              />
              
              <SidebarItem 
                icon={Library} 
                label="السجل"
                href="/history"
                isActive={pathname === '/history'}
                onClick={onClose}
              />


            <SidebarItem 
              icon={StickyNote} 
              label="ملاحظاتي"
              href="/notes"
              isActive={pathname === '/notes'}
              onClick={onClose}
            />
          </div>

        <div className="h-[1px] bg-[#e5e5e5] my-[12px] mx-[12px]" />

        <div className="px-[32px] py-[16px] flex flex-col gap-[12px]">
          <p className="text-[14px] leading-[20px] font-normal text-[#0f0f0f] text-right">
            سجّل الدخول للإعجاب بالفيديوهات والتعليق والاشتراك.
          </p>
          <button 
            className="flex items-center justify-center w-fit px-[15px] h-[36px] border border-[#e5e5e5] rounded-full text-[#065fd4] font-medium text-[14px] hover:bg-[#def1ff] hover:border-transparent transition-colors"
          >
            تسجيل الدخول
            <UserCircle className="w-[20px] h-[20px] mr-[8px]" />
          </button>
        </div>

        <div className="h-[1px] bg-[#e5e5e5] my-[12px] mx-[12px]" />

        <div className="px-[24px] py-[8px]">
          <h3 className="text-[16px] font-medium text-[#0f0f0f] mb-[4px] text-right">استكشف</h3>
        </div>

      </aside>
    </>
  );
};

export default SidebarGuide;