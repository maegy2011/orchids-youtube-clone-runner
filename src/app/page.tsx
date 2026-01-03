"use client";

import { useState } from "react";
import Masthead from "@/components/sections/masthead";
import SidebarGuide from "@/components/sections/sidebar-guide";
import FeedFilterBar from "@/components/sections/feed-filter-bar";
import VideoGrid from "@/components/sections/video-grid";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategoryChange = (category: string) => {
    setSearchQuery(category);
  };

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Masthead onSearch={handleSearch} onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <SidebarGuide isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="mr-0 lg:mr-[240px] pt-[56px]">
        <FeedFilterBar onCategoryChange={handleCategoryChange} />
        <VideoGrid searchQuery={searchQuery} />
      </main>
    </div>
  );
}
