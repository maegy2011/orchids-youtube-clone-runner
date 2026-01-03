"use client";

import { useState, useEffect } from "react";
import { useUser } from "./use-user";

interface HistoryItem {
  id: number;
  userId: string;
  videoId: string;
  videoTitle: string;
  videoThumbnail: string | null;
  watchProgress: number;
  watchedAt: Date;
}

export function useHistory() {
  const { userId } = useUser();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`/api/history?userId=${userId}`);
      const data = await response.json();
      setHistory(data);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchHistory();
    }
  }, [userId]);

  const isWatched = (videoId: string) => {
    return history.some((h) => h.videoId === videoId);
  };

  const getWatchProgress = (videoId: string): number => {
    const item = history.find((h) => h.videoId === videoId);
    return item?.watchProgress ?? 0;
  };

  return { history, loading, isWatched, getWatchProgress, refresh: fetchHistory };
}
