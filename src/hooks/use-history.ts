"use client";

import { useState, useEffect } from "react";
import { useUser } from "./use-user";

export function useHistory() {
  const { userId } = useUser();
  const [history, setHistory] = useState<any[]>([]);
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

  return { history, loading, isWatched, refresh: fetchHistory };
}
