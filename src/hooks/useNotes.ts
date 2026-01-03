"use client";

import { useState, useEffect, useCallback } from 'react';
import { VideoNote } from '@/lib/types';
import { useUser } from './use-user';

export function useNotes() {
  const { userId } = useUser();
  const [notes, setNotes] = useState<VideoNote[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`/api/notes?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch notes');
      
      const data = await response.json();
      if (Array.isArray(data)) {
        const mappedNotes: VideoNote[] = data.map((n: any) => ({
          id: n.id,
          videoId: n.videoId,
          videoTitle: n.videoTitle,
          content: n.content,
          startTime: n.startTime,
          endTime: n.endTime,
          createdAt: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: n.updatedAt ? new Date(n.updatedAt).toISOString() : new Date().toISOString(),
        }));
        setNotes(mappedNotes);
      }
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setIsLoaded(true);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchNotes();
    } else {
      setIsLoaded(true);
    }
  }, [userId, fetchNotes]);

  const addNote = useCallback(async (note: Omit<VideoNote, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!userId) return null;

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...note,
        }),
      });

      if (!response.ok) throw new Error('Failed to create note');

      const newNote = await response.json();
      const mappedNote: VideoNote = {
        id: newNote.id,
        videoId: newNote.videoId,
        videoTitle: newNote.videoTitle,
        content: newNote.content,
        startTime: newNote.startTime,
        endTime: newNote.endTime,
        createdAt: newNote.createdAt ? new Date(newNote.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: newNote.updatedAt ? new Date(newNote.updatedAt).toISOString() : new Date().toISOString(),
      };
      
      setNotes(prev => [...prev, mappedNote]);
      return mappedNote;
    } catch (error) {
      console.error('Failed to add note:', error);
      return null;
    }
  }, [userId]);

  const updateNote = useCallback(async (id: string, updates: Partial<VideoNote>) => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...updates,
        }),
      });

      if (!response.ok) throw new Error('Failed to update note');

      const updatedNote = await response.json();
      setNotes(prev => prev.map(note => 
        note.id === id 
          ? {
              ...note,
              ...updates,
              updatedAt: updatedNote.updatedAt ? new Date(updatedNote.updatedAt).toISOString() : new Date().toISOString(),
            }
          : note
      ));
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  }, [userId]);

  const deleteNote = useCallback(async (id: string) => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/notes/${id}?userId=${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete note');

      setNotes(prev => prev.filter(note => note.id !== id));
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  }, [userId]);

  const getNotesByVideoId = useCallback((videoId: string) => {
    return notes.filter(note => note.videoId === videoId);
  }, [notes]);

  const getAllNotes = useCallback(() => {
    return notes.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [notes]);

  return {
    notes,
    isLoaded,
    addNote,
    updateNote,
    deleteNote,
    getNotesByVideoId,
    getAllNotes,
  };
}
