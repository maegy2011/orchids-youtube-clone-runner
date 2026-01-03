"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  StickyNote, 
  Play, 
  Trash2, 
  Edit2, 
  Search, 
  ArrowRight,
  Clock,
  Video,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { VideoNote } from '@/lib/types';
import Masthead from '@/components/sections/masthead';
import SidebarGuide from '@/components/sections/sidebar-guide';

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function parseTime(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function NotesPage() {
  const { getAllNotes, deleteNote, updateNote, isLoaded } = useNotes();
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const allNotes = isLoaded ? getAllNotes() : [];
  
  const filteredNotes = allNotes.filter(note => 
    note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.videoTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedNotes = filteredNotes.reduce((acc, note) => {
    if (!acc[note.videoId]) {
      acc[note.videoId] = {
        videoId: note.videoId,
        videoTitle: note.videoTitle,
        notes: [],
      };
    }
    acc[note.videoId].notes.push(note);
    return acc;
  }, {} as Record<string, { videoId: string; videoTitle: string; notes: VideoNote[] }>);

  const startEditing = (note: VideoNote) => {
    setEditingNote(note.id);
    setEditContent(note.content);
    setEditStartTime(formatTime(note.startTime));
    setEditEndTime(formatTime(note.endTime));
  };

  const cancelEditing = () => {
    setEditingNote(null);
    setEditContent('');
    setEditStartTime('');
    setEditEndTime('');
  };

  const saveEdit = () => {
    if (!editingNote || !editContent.trim()) return;
    
    updateNote(editingNote, {
      content: editContent,
      startTime: parseTime(editStartTime),
      endTime: parseTime(editEndTime),
    });
    
    cancelEditing();
  };

  const confirmDelete = (noteId: string) => {
    deleteNote(noteId);
    setDeleteConfirm(null);
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9]" dir="rtl">
      <Masthead onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <SidebarGuide isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="mr-0 lg:mr-[240px] pt-[56px] pb-12 px-4 md:px-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="py-6">
            <div className="flex items-center gap-3 mb-6">
              <StickyNote className="w-8 h-8 text-red-600" />
              <h1 className="text-2xl font-bold text-[#0f0f0f]">ملاحظاتي</h1>
            </div>

            <div className="relative mb-6">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#606060]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="البحث في الملاحظات أو عناوين الفيديوهات..."
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
            ) : allNotes.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border border-[#e5e5e5]">
                <StickyNote className="w-16 h-16 text-[#ccc] mx-auto mb-4" />
                <h2 className="text-xl font-medium text-[#0f0f0f] mb-2">لا توجد ملاحظات بعد</h2>
                <p className="text-[#606060] mb-6">
                  ابدأ بمشاهدة الفيديوهات وأضف ملاحظاتك أثناء المشاهدة
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors"
                >
                  <ArrowRight size={20} />
                  تصفح الفيديوهات
                </Link>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border border-[#e5e5e5]">
                <Search className="w-16 h-16 text-[#ccc] mx-auto mb-4" />
                <h2 className="text-xl font-medium text-[#0f0f0f] mb-2">لا توجد نتائج</h2>
                <p className="text-[#606060]">
                  لم يتم العثور على ملاحظات تطابق "{searchQuery}"
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.values(groupedNotes).map((group) => (
                  <div key={group.videoId} className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
                    <Link
                      href={`/watch/${group.videoId}`}
                      className="flex items-center gap-4 p-4 bg-[#f9f9f9] border-b border-[#e5e5e5] hover:bg-[#f2f2f2] transition-colors"
                    >
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Video className="w-6 h-6 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-[#0f0f0f] line-clamp-1">{group.videoTitle}</h3>
                        <p className="text-sm text-[#606060]">{group.notes.length} ملاحظة</p>
                      </div>
                      <Play className="w-5 h-5 text-[#606060]" />
                    </Link>

                    <div className="divide-y divide-[#e5e5e5]">
                      {group.notes.map((note) => (
                        <div key={note.id} className="p-4 hover:bg-[#f9f9f9] transition-colors">
                          {editingNote === note.id ? (
                            <div className="space-y-3">
                              <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full p-3 border border-[#e5e5e5] rounded-lg resize-none h-24 text-sm focus:outline-none focus:border-red-600"
                                dir="rtl"
                                autoFocus
                              />
                              <div className="flex items-center gap-4">
                                <div className="flex-1">
                                  <label className="text-xs text-[#606060] mb-1 block">البداية</label>
                                  <input
                                    type="text"
                                    value={editStartTime}
                                    onChange={(e) => setEditStartTime(e.target.value)}
                                    className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:border-red-600"
                                    placeholder="0:00"
                                  />
                                </div>
                                <div className="flex-1">
                                  <label className="text-xs text-[#606060] mb-1 block">النهاية</label>
                                  <input
                                    type="text"
                                    value={editEndTime}
                                    onChange={(e) => setEditEndTime(e.target.value)}
                                    className="w-full px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:border-red-600"
                                    placeholder="0:00"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center gap-2 justify-end">
                                <button
                                  onClick={cancelEditing}
                                  className="px-4 py-2 text-[#606060] hover:bg-[#f2f2f2] rounded-lg transition-colors"
                                >
                                  إلغاء
                                </button>
                                <button
                                  onClick={saveEdit}
                                  disabled={!editContent.trim()}
                                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                >
                                  <Check size={18} />
                                  حفظ
                                </button>
                              </div>
                            </div>
                          ) : deleteConfirm === note.id ? (
                            <div className="flex items-center justify-between bg-red-50 p-3 rounded-lg border border-red-200">
                              <div className="flex items-center gap-2 text-red-600">
                                <AlertCircle size={18} />
                                <span className="text-sm">هل تريد حذف هذه الملاحظة؟</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setDeleteConfirm(null)}
                                  className="px-3 py-1 text-[#606060] hover:bg-white rounded transition-colors text-sm"
                                >
                                  إلغاء
                                </button>
                                <button
                                  onClick={() => confirmDelete(note.id)}
                                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                                >
                                  حذف
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-[#0f0f0f] mb-3 whitespace-pre-wrap">{note.content}</p>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-sm text-[#606060]">
                                  <span className="flex items-center gap-1 bg-[#f2f2f2] px-2 py-1 rounded">
                                    <Clock size={14} />
                                    {formatTime(note.startTime)} - {formatTime(note.endTime)}
                                  </span>
                                  <span className="hidden sm:inline">{formatDate(note.createdAt)}</span>
                                </div>

                                <div className="flex items-center gap-1">
                                  <Link
                                    href={`/watch/${note.videoId}?t=${note.startTime}`}
                                    className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors"
                                    title="تشغيل"
                                  >
                                    <Play size={18} />
                                  </Link>
                                  <button
                                    onClick={() => startEditing(note)}
                                    className="p-2 text-[#606060] hover:bg-[#e5e5e5] rounded-full transition-colors"
                                    title="تعديل"
                                  >
                                    <Edit2 size={18} />
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm(note.id)}
                                    className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                                    title="حذف"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {allNotes.length > 0 && (
              <div className="mt-8 text-center text-sm text-[#606060]">
                إجمالي الملاحظات: {allNotes.length} • عدد الفيديوهات: {Object.keys(groupedNotes).length}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
