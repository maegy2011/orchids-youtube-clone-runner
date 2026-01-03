"use client";

import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const categories = [
  "الكل",
  "تعليم",
  "برمجة",
  "قرآن",
  "إسلامي",
  "علوم",
  "وثائقي",
  "أطفال",
  "لغات",
  "تاريخ",
  "صحة",
  "رياضيات",
  "أعمال",
  "طبخ",
  "حرف يدوية",
  "طبيعة",
  "تقنية",
  "ذكاء اصطناعي",
];

export default function FeedFilterBar({ onCategoryChange }: { onCategoryChange?: (category: string) => void }) {
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowRightArrow(scrollLeft > 0);
      setShowLeftArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === "right" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(checkScroll, 300);
    }
  };

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    if (onCategoryChange) {
      onCategoryChange(category === "الكل" ? "" : category);
    }
  };

  return (
    <div className="sticky top-[56px] z-30 w-full bg-white/95 backdrop-blur-sm px-4 flex items-center h-14">
      <div className="relative w-full flex items-center overflow-hidden">
        {showRightArrow && (
          <div className="absolute right-0 top-0 bottom-0 flex items-center z-10">
            <div className="h-full w-12 bg-gradient-to-l from-white via-white to-transparent pointer-events-none" />
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 p-2 hover:bg-[#f2f2f2] rounded-full transition-colors flex items-center justify-center bg-white"
              aria-label="التصنيفات السابقة"
            >
              <ChevronRight className="w-6 h-6 text-[#0f0f0f]" />
            </button>
          </div>
        )}

        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap py-3 pl-8"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          dir="rtl"
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer inline-block",
                activeCategory === category
                  ? "bg-[#0f0f0f] text-white"
                  : "bg-[#f2f2f2] text-[#0f0f0f] hover:bg-[#e5e5e5]"
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {showLeftArrow && (
          <div className="absolute left-0 top-0 bottom-0 flex items-center z-10">
            <div className="h-full w-24 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none" />
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 p-2 hover:bg-[#f2f2f2] rounded-full transition-colors flex items-center justify-center bg-white"
              aria-label="التصنيفات التالية"
            >
              <ChevronLeft className="w-6 h-6 text-[#0f0f0f]" />
            </button>
          </div>
        )}
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}