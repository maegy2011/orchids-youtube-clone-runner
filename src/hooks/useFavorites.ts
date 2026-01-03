"use client";

import { useState, useEffect, useCallback } from 'react';
import { useUser } from './use-user';

export interface FavoriteItem {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  channelName: string;
  duration: string;
  addedAt: string;
}

export function useFavorites() {
  const { userId } = useUser();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [deniedVideos, setDeniedVideos] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchFavorites = useCallback(async () => {
    if (!userId) return;
    
    try {
      const [favResponse, deniedResponse] = await Promise.all([
        fetch(`/api/favorites?userId=${userId}`),
        fetch(`/api/favorites?userId=${userId}&type=denied`),
      ]);

      if (favResponse.ok) {
        const favData = await favResponse.json();
        if (Array.isArray(favData)) {
          const mappedFavorites: FavoriteItem[] = favData.map((f: any) => ({
            id: f.id,
            videoId: f.videoId,
            title: f.title,
            thumbnail: f.thumbnail || '',
            channelName: f.channelName,
            duration: f.duration || '',
            addedAt: f.addedAt ? new Date(f.addedAt).toISOString() : new Date().toISOString(),
          }));
          setFavorites(mappedFavorites);
        }
      }

      if (deniedResponse.ok) {
        const deniedData = await deniedResponse.json();
        if (Array.isArray(deniedData)) {
          setDeniedVideos(deniedData);
        }
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    } finally {
      setIsLoaded(true);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchFavorites();
    } else {
      setIsLoaded(true);
    }
  }, [userId, fetchFavorites]);

  const addFavorite = useCallback(async (video: Omit<FavoriteItem, 'id' | 'addedAt'>) => {
    if (!userId) return null;
    
    if (favorites.some(f => f.videoId === video.videoId)) {
      return null;
    }

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...video,
        }),
      });

      if (!response.ok) throw new Error('Failed to add favorite');

      const newFavorite = await response.json();
      if (newFavorite.id) {
        const mappedFavorite: FavoriteItem = {
          id: newFavorite.id,
          videoId: newFavorite.videoId,
          title: newFavorite.title,
          thumbnail: newFavorite.thumbnail || '',
          channelName: newFavorite.channelName,
          duration: newFavorite.duration || '',
          addedAt: newFavorite.addedAt ? new Date(newFavorite.addedAt).toISOString() : new Date().toISOString(),
        };
        setFavorites(prev => [...prev, mappedFavorite]);
        return mappedFavorite;
      }
      return null;
    } catch (error) {
      console.error('Failed to add favorite:', error);
      return null;
    }
  }, [userId, favorites]);

  const removeFavorite = useCallback(async (videoId: string) => {
    if (!userId) return;

    try {
      const response = await fetch('/api/favorites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, videoId }),
      });

      if (!response.ok) throw new Error('Failed to remove favorite');

      setFavorites(prev => prev.filter(f => f.videoId !== videoId));
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  }, [userId]);

  const toggleFavorite = useCallback(async (video: Omit<FavoriteItem, 'id' | 'addedAt'>) => {
    const exists = favorites.some(f => f.videoId === video.videoId);
    if (exists) {
      await removeFavorite(video.videoId);
      return false;
    } else {
      await addFavorite(video);
      return true;
    }
  }, [favorites, addFavorite, removeFavorite]);

  const isFavorite = useCallback((videoId: string) => {
    return favorites.some(f => f.videoId === videoId);
  }, [favorites]);

  const denyVideo = useCallback(async (videoId: string) => {
    if (!userId) return;

    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, videoId, type: 'deny' }),
      });

      if (!response.ok) throw new Error('Failed to deny video');

      setDeniedVideos(prev => {
        if (prev.includes(videoId)) return prev;
        return [...prev, videoId];
      });
      setFavorites(prev => prev.filter(f => f.videoId !== videoId));
    } catch (error) {
      console.error('Failed to deny video:', error);
    }
  }, [userId]);

  const undenyVideo = useCallback(async (videoId: string) => {
    if (!userId) return;

    try {
      const response = await fetch('/api/favorites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, videoId, type: 'deny' }),
      });

      if (!response.ok) throw new Error('Failed to undeny video');

      setDeniedVideos(prev => prev.filter(id => id !== videoId));
    } catch (error) {
      console.error('Failed to undeny video:', error);
    }
  }, [userId]);

  const isDenied = useCallback((videoId: string) => {
    return deniedVideos.includes(videoId);
  }, [deniedVideos]);

  const getAllFavorites = useCallback(() => {
    return favorites.sort((a, b) => 
      new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
    );
  }, [favorites]);

  return {
    favorites,
    deniedVideos,
    isLoaded,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    denyVideo,
    undenyVideo,
    isDenied,
    getAllFavorites,
  };
}
