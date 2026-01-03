/* Video Notes Enhancement */
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Share2, 
  Download, 
  MoreHorizontal,
  Plus,
  Play,
  Pause,
  X,
  Clock,
  Trash2,
  Edit2,
  Check,
  ArrowRight,
  Music,
  Search,
  Square,
  Circle,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { VideoDetails, VideoNote } from '@/lib/types';
import { useNotes } from '@/hooks/useNotes';
import { useUser } from '@/hooks/use-user';
import Masthead from '@/components/sections/masthead';
import DownloadModal from '@/components/ui/download-modal';
import BackgroundPlayer from '@/components/ui/background-player';

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

export default function WatchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const videoId = params.id as string;
  const startTime = searchParams.get('t');
  
  const [video, setVideo] = useState<VideoDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDescription, setShowDescription] = useState(false);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<any>(null);
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteStartTime, setNoteStartTime] = useState('0:00');
  const [noteEndTime, setNoteEndTime] = useState('0:00');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [noteSearch, setNoteSearch] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureStartTime, setCaptureStartTime] = useState<number | null>(null);
  const [quickNotes, setQuickNotes] = useState<{id: string; startTime: number; endTime: number; createdAt: number}[]>([]);
  
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [backgroundPlayEnabled, setBackgroundPlayEnabled] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [blocked, setBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState<string | null>(null);

  const { userId } = useUser();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  
  const { addNote, updateNote, deleteNote, getNotesByVideoId, isLoaded } = useNotes();
  const videoNotes = isLoaded ? getNotesByVideoId(videoId) : [];
  
  const filteredNotes = videoNotes.filter(note => 
    noteSearch === '' || note.content.toLowerCase().includes(noteSearch.toLowerCase())
  );

  useEffect(() => {
    const checkSubscription = async () => {
      if (!userId || !video) return;
      try {
        const response = await fetch(`/api/subscriptions?userId=${userId}`);
        const subs = await response.json();
        const isSub = subs.some((s: any) => s.channelId === video.channelId);
        setIsSubscribed(isSub);
      } catch (err) {
        console.error('Error checking subscription:', err);
      }
    };

    if (userId && video) {
      checkSubscription();
    }
  }, [userId, video]);

  useEffect(() => {
    const recordHistory = async () => {
      if (!userId || !video) return;
      try {
        await fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            videoId: videoId,
            videoTitle: video.title,
            videoThumbnail: video.thumbnail,
          }),
        });
      } catch (err) {
        console.error('Error recording history:', err);
      }
    };

    if (userId && video) {
      const timer = setTimeout(recordHistory, 5000);
      return () => clearTimeout(timer);
    }
  }, [userId, video, videoId]);

  const toggleSubscription = async () => {
    if (!userId || !video || subscribing) return;
    setSubscribing(true);
    try {
      if (isSubscribed) {
        await fetch('/api/subscriptions', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, channelId: video.channelId }),
        });
        setIsSubscribed(false);
      } else {
        await fetch('/api/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            channelId: video.channelId,
            channelTitle: video.channelName,
            channelThumbnail: video.channelAvatar,
          }),
        });
        setIsSubscribed(true);
      }
    } catch (err) {
      console.error('Error toggling subscription:', err);
    } finally {
      setSubscribing(false);
    }
  };

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/videos/${videoId}`);
        const data = await response.json();
        
        if (response.status === 403 && data.blocked) {
          setBlocked(true);
          setBlockReason(data.reason || 'المحتوى غير مسموح به');
          setLoading(false);
          return;
        }
        
        if (!response.ok) {
          throw new Error(data.error || 'فشل جلب معلومات الفيديو');
        }
        
        setVideo(data);
        setBlocked(false);
      } catch (err) {
        console.error('Error fetching video:', err);
        setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.');
      } finally {
        setLoading(false);
      }
    };

    if (videoId) {
      fetchVideo();
    }
  }, [videoId]);

  useEffect(() => {
    if (!backgroundPlayEnabled && video) {
      setPlayerReady(true);
    }
  }, [backgroundPlayEnabled, video]);

  useEffect(() => {
    if (typeof window === 'undefined' || backgroundPlayEnabled || !video) return;

    const loadYouTubeAPI = () => {
      if (!(window as any).YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }
    };

    const initPlayer = () => {
      if (!iframeRef.current || playerRef.current) return;
      
      try {
        playerRef.current = new (window as any).YT.Player(iframeRef.current, {
          events: {
            onReady: () => {
              setPlayerReady(true);
              if (timeUpdateIntervalRef.current) {
                clearInterval(timeUpdateIntervalRef.current);
              }
              timeUpdateIntervalRef.current = setInterval(() => {
                if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                  const time = playerRef.current.getCurrentTime();
                  if (typeof time === 'number' && !isNaN(time)) {
                    setCurrentTime(time);
                  }
                }
              }, 500);
            },
            onStateChange: (event: any) => {
              if (event.data === 1 && playerRef.current) {
                const time = playerRef.current.getCurrentTime();
                if (typeof time === 'number' && !isNaN(time)) {
                  setCurrentTime(time);
                }
              }
            }
          }
        });
      } catch (e) {
        console.log('YouTube player init error:', e);
      }
    };

    loadYouTubeAPI();

    (window as any).onYouTubeIframeAPIReady = () => {
      setTimeout(initPlayer, 100);
    };

    if ((window as any).YT && (window as any).YT.Player) {
      setTimeout(initPlayer, 100);
    }

    return () => {
      if (timeUpdateIntervalRef.current) {
        clearInterval(timeUpdateIntervalRef.current);
      }
    };
  }, [video, backgroundPlayEnabled]);

  const getCurrentPlayerTime = () => {
    let time = currentTime;
    if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
      const playerTime = playerRef.current.getCurrentTime();
      if (typeof playerTime === 'number' && !isNaN(playerTime)) {
        time = playerTime;
        setCurrentTime(time);
      }
    }
    return time;
  };

  const quickCapture = () => {
    const time = getCurrentPlayerTime();
    const newQuickNote = {
      id: `quick-${Date.now()}`,
      startTime: time,
      endTime: time,
      createdAt: Date.now(),
    };
    setQuickNotes(prev => [...prev, newQuickNote]);
  };

  const startCapture = () => {
    const time = getCurrentPlayerTime();
    setCaptureStartTime(time);
    setNoteStartTime(formatTime(time));
    setNoteEndTime(formatTime(time));
    setIsCapturing(true);
  };

  const stopCapture = () => {
    const time = getCurrentPlayerTime();
    const startTime = captureStartTime ?? 0;
    const newQuickNote = {
      id: `quick-${Date.now()}`,
      startTime: startTime,
      endTime: time,
      createdAt: Date.now(),
    };
    setQuickNotes(prev => [...prev, newQuickNote]);
    setNoteEndTime(formatTime(time));
    setIsCapturing(false);
    setCaptureStartTime(null);
  };

  const editQuickNote = (quickNote: {id: string; startTime: number; endTime: number}) => {
    setNoteStartTime(formatTime(quickNote.startTime));
    setNoteEndTime(formatTime(quickNote.endTime));
    setNoteContent('');
    setEditingNote(null);
    setShowNoteForm(true);
    setQuickNotes(prev => prev.filter(n => n.id !== quickNote.id));
  };

  const deleteQuickNote = (id: string) => {
    setQuickNotes(prev => prev.filter(n => n.id !== id));
  };

  const handleAddNote = () => {
    if (!noteContent.trim() || !video) return;

    const startSeconds = parseTime(noteStartTime);
    const endSeconds = parseTime(noteEndTime);

    if (editingNote) {
      updateNote(editingNote, {
        content: noteContent,
        startTime: startSeconds,
        endTime: endSeconds,
      });
      setEditingNote(null);
    } else {
      addNote({
        videoId,
        videoTitle: video.title,
        content: noteContent,
        startTime: startSeconds,
        endTime: endSeconds,
      });
    }

    setNoteContent('');
    setNoteStartTime('0:00');
    setNoteEndTime('0:00');
    setShowNoteForm(false);
    setCaptureStartTime(null);
    setIsCapturing(false);
  };

  const handleEditNote = (note: VideoNote) => {
    setEditingNote(note.id);
    setNoteContent(note.content);
    setNoteStartTime(formatTime(note.startTime));
    setNoteEndTime(formatTime(note.endTime));
    setShowNoteForm(true);
  };

  const handleDeleteNote = (noteId: string) => {
    deleteNote(noteId);
    if (activeNoteId === noteId) {
      setActiveNoteId(null);
    }
  };

  const playNoteSegment = (note: VideoNote) => {
    if (iframeRef.current) {
      const newSrc = `https://www.youtube-nocookie.com/embed/${videoId}?start=${Math.floor(note.startTime)}&autoplay=1&rel=0&modestbranding=1&hl=ar`;
      iframeRef.current.src = newSrc;
      setActiveNoteId(note.id);
    }
  };

  const captureCurrentTime = (type: 'start' | 'end') => {
    const time = formatTime(currentTime);
    if (type === 'start') {
      setNoteStartTime(time);
    } else {
      setNoteEndTime(time);
    }
  };

  const enableBackgroundPlay = () => {
    setBackgroundPlayEnabled(true);
  };

  const disableBackgroundPlay = () => {
    setBackgroundPlayEnabled(false);
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/?search=${encodeURIComponent(query)}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
          <p className="text-[#606060]">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 p-4" dir="rtl">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
          <AlertCircle size={32} className="text-red-600" />
        </div>
        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold text-[#0f0f0f] mb-2">حدث خطأ</h1>
          <p className="text-[#606060]">{error}</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-[#f2f2f2] text-[#0f0f0f] rounded-full hover:bg-[#e5e5e5] transition-colors"
          >
            إعادة المحاولة
          </button>
          <Link 
            href="/" 
            className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
          >
            <ArrowRight size={20} />
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 p-4" dir="rtl">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
          <X size={40} className="text-red-600" />
        </div>
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-[#0f0f0f] mb-2">المحتوى محظور</h1>
          <p className="text-[#606060]">{blockReason}</p>
        </div>
        <Link 
          href="/" 
          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
        >
          <ArrowRight size={20} />
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 p-4" dir="rtl">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
          <AlertCircle size={32} className="text-gray-400" />
        </div>
        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold text-[#0f0f0f] mb-2">الفيديو غير موجود</h1>
          <p className="text-[#606060]">لم نتمكن من العثور على الفيديو المطلوب</p>
        </div>
        <Link 
          href="/" 
          className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
        >
          <ArrowRight size={20} />
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <Masthead onMenuClick={() => setSidebarOpen(!sidebarOpen)} onSearch={handleSearch} />
      
      <main className="pt-[56px] px-4 lg:px-6 xl:px-24 pb-12">
        <div className="max-w-[1800px] mx-auto flex flex-col lg:flex-row gap-6">
          <div className="flex-1 max-w-full lg:max-w-[calc(100%-400px)]">
            {!backgroundPlayEnabled ? (
              <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden mb-4">
                <iframe
                  ref={iframeRef}
                  src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&hl=ar&enablejsapi=1${startTime ? `&start=${startTime}` : ''}`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  title={video.title}
                />
              </div>
            ) : (
              <div className="relative w-full aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden mb-4 flex items-center justify-center">
                <div className="text-center text-white">
                  <Music size={64} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">وضع الصوت مفعّل</p>
                  <p className="text-sm text-gray-400 mt-2">يمكنك قفل الشاشة والاستماع</p>
                  <button
                    onClick={disableBackgroundPlay}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded-full text-sm hover:bg-red-700 transition-colors"
                  >
                    العودة للفيديو
                  </button>
                </div>
              </div>
            )}

            <h1 className="text-lg sm:text-xl font-bold text-[#0f0f0f] mb-2">{video.title}</h1>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                {video.channelAvatar && (
                  <img
                    src={video.channelAvatar}
                    alt={video.channelName}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div>
                  <h3 className="font-medium text-[#0f0f0f] flex items-center gap-1">
                    {video.channelName}
                    {video.isVerified && (
                      <svg className="w-4 h-4 text-[#606060]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zM10 17l-5-5 1.4-1.4 3.6 3.6 7.6-7.6L19 8l-9 9z" />
                      </svg>
                    )}
                  </h3>
                  <p className="text-sm text-[#606060]">{video.channelSubscribers} مشترك</p>
                </div>
                <button 
                  onClick={toggleSubscription}
                  disabled={subscribing}
                  className={`mr-4 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    isSubscribed 
                      ? 'bg-[#f2f2f2] text-[#0f0f0f] hover:bg-[#e5e5e5]' 
                      : 'bg-[#0f0f0f] text-white hover:bg-[#272727]'
                  } disabled:opacity-50`}
                >
                  {isSubscribed ? 'تم الاشتراك' : 'اشتراك'}
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center bg-[#f2f2f2] rounded-full overflow-hidden">
                  <button className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 hover:bg-[#e5e5e5] transition-colors border-l border-[#ccc]">
                    <ThumbsUp size={18} className="sm:w-5 sm:h-5" />
                    <span className="text-xs sm:text-sm font-medium">{video.likes}</span>
                  </button>
                  <button className="px-2 sm:px-4 py-2 hover:bg-[#e5e5e5] transition-colors">
                    <ThumbsDown size={18} className="sm:w-5 sm:h-5" />
                  </button>
                </div>

                <button className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-[#f2f2f2] rounded-full hover:bg-[#e5e5e5] transition-colors">
                  <Share2 size={18} className="sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm font-medium hidden sm:inline">مشاركة</span>
                </button>

                <button 
                  onClick={() => setShowDownloadModal(true)}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-[#f2f2f2] rounded-full hover:bg-[#e5e5e5] transition-colors"
                >
                  <Download size={18} className="sm:w-5 sm:h-5" />
                  <span className="text-xs sm:text-sm font-medium hidden sm:inline">تنزيل</span>
                </button>

                {!backgroundPlayEnabled && (
                  <button 
                    onClick={enableBackgroundPlay}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full hover:opacity-90 transition-opacity"
                    title="وضع الصوت - يعمل عند قفل الشاشة"
                  >
                    <Music size={18} className="sm:w-5 sm:h-5" />
                    <span className="text-xs sm:text-sm font-medium hidden sm:inline">وضع الصوت</span>
                  </button>
                )}

                <button className="p-2 bg-[#f2f2f2] rounded-full hover:bg-[#e5e5e5] transition-colors">
                  <MoreHorizontal size={20} />
                </button>
              </div>
            </div>

            <div className="bg-[#f2f2f2] rounded-xl p-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-[#0f0f0f] font-medium mb-2">
                <span>{video.views}</span>
                <span>•</span>
                <span>{video.uploadDate}</span>
              </div>
              <div className={`text-sm text-[#0f0f0f] ${!showDescription && 'line-clamp-2'}`}>
                {video.description}
              </div>
              {video.description && video.description.length > 100 && (
                <button 
                  onClick={() => setShowDescription(!showDescription)}
                  className="text-sm font-medium text-[#0f0f0f] mt-2"
                >
                  {showDescription ? 'عرض أقل' : 'عرض المزيد'}
                </button>
              )}
            </div>
          </div>

            <div className="w-full lg:w-[380px] xl:w-[400px] flex-shrink-0">
              <div className="bg-white border border-[#e5e5e5] rounded-xl p-3 sm:p-4 lg:sticky lg:top-[72px]">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base sm:text-lg font-bold text-[#0f0f0f]">ملاحظات الفيديو</h2>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={quickCapture}
                      className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700 transition-colors"
                      title="التقاط سريع - اضغط لحفظ الوقت الحالي"
                    >
                      <Plus size={16} />
                      <Clock size={14} />
                    </button>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">الوقت:</span>
                    </div>
                    <span className="text-lg font-bold text-blue-600 font-mono">{formatTime(currentTime)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    {!isCapturing ? (
                      <button
                        onClick={startCapture}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                      >
                        <Circle size={12} className="fill-current" />
                        بدء مقطع
                      </button>
                    ) : (
                      <button
                        onClick={stopCapture}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors animate-pulse"
                      >
                        <Square size={12} className="fill-current" />
                        إيقاف ({formatTime(captureStartTime ?? 0)})
                      </button>
                    )}
                  </div>
                </div>

                {quickNotes.length > 0 && (
                  <div className="mb-3">
                    <h3 className="text-xs font-medium text-[#606060] mb-2">ملاحظات سريعة (بدون محتوى)</h3>
                    <div className="space-y-2 max-h-[120px] overflow-y-auto">
                      {quickNotes.map((qn) => (
                        <div key={qn.id} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg p-2">
                          <span className="text-sm font-mono text-amber-700">
                            {formatTime(qn.startTime)} {qn.endTime !== qn.startTime && `- ${formatTime(qn.endTime)}`}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => editQuickNote(qn)}
                              className="p-1.5 text-amber-600 hover:bg-amber-100 rounded-full transition-colors"
                              title="إضافة محتوى"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => deleteQuickNote(qn.id)}
                              className="p-1.5 text-red-500 hover:bg-red-100 rounded-full transition-colors"
                              title="حذف"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div className="relative mb-4">
                <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#606060]" />
                <input
                  type="text"
                  placeholder="بحث في الملاحظات..."
                  value={noteSearch}
                  onChange={(e) => setNoteSearch(e.target.value)}
                  className="w-full pr-10 pl-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:border-red-600"
                  dir="rtl"
                />
              </div>

              {showNoteForm && (
                <div className="bg-[#f9f9f9] rounded-lg p-4 mb-4 border border-[#e5e5e5]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-[#0f0f0f]">
                      {editingNote ? 'تعديل الملاحظة' : 'ملاحظة جديدة'}
                    </h3>
                    <button onClick={() => {
                      setShowNoteForm(false);
                      setEditingNote(null);
                      setIsCapturing(false);
                      setCaptureStartTime(null);
                    }}>
                      <X size={20} className="text-[#606060]" />
                    </button>
                  </div>

                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="اكتب ملاحظتك هنا..."
                    className="w-full p-3 border border-[#e5e5e5] rounded-lg resize-none h-24 text-sm focus:outline-none focus:border-red-600"
                    dir="rtl"
                  />

                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex-1">
                      <label className="text-xs text-[#606060] mb-1 block">وقت البداية</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={noteStartTime}
                          onChange={(e) => setNoteStartTime(e.target.value)}
                          className="flex-1 px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:border-red-600"
                          placeholder="0:00"
                        />
                        <button
                          onClick={() => captureCurrentTime('start')}
                          className="p-2 bg-[#e5e5e5] rounded-lg hover:bg-[#d5d5d5] transition-colors"
                          title="التقاط الوقت الحالي"
                        >
                          <Clock size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1">
                      <label className="text-xs text-[#606060] mb-1 block">وقت النهاية</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={noteEndTime}
                          onChange={(e) => setNoteEndTime(e.target.value)}
                          className="flex-1 px-3 py-2 border border-[#e5e5e5] rounded-lg text-sm focus:outline-none focus:border-red-600"
                          placeholder="0:00"
                        />
                        <button
                          onClick={() => captureCurrentTime('end')}
                          className="p-2 bg-[#e5e5e5] rounded-lg hover:bg-[#d5d5d5] transition-colors"
                          title="التقاط الوقت الحالي"
                        >
                          <Clock size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleAddNote}
                    disabled={!noteContent.trim()}
                    className="w-full mt-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Check size={18} />
                    {editingNote ? 'حفظ التعديلات' : 'حفظ الملاحظة'}
                  </button>
                </div>
              )}

              <div className="space-y-3 max-h-[40vh] lg:max-h-[60vh] overflow-y-auto">
                {filteredNotes.length === 0 ? (
                  <p className="text-center text-[#606060] py-8">
                    {noteSearch ? 'لا توجد نتائج للبحث' : 'لا توجد ملاحظات بعد'}
                  </p>
                ) : (
                  filteredNotes.map((note) => (
                    <div
                      key={note.id}
                      className={`bg-[#f9f9f9] rounded-lg p-3 border transition-colors ${
                        activeNoteId === note.id ? 'border-red-600 bg-red-50' : 'border-[#e5e5e5]'
                      }`}
                    >
                      <p className="text-sm text-[#0f0f0f] mb-2 whitespace-pre-wrap">{note.content}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-[#606060]">
                          <span className="bg-[#e5e5e5] px-2 py-1 rounded">
                            {formatTime(note.startTime)} - {formatTime(note.endTime)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => playNoteSegment(note)}
                            className={`p-1.5 rounded-full transition-colors ${
                              activeNoteId === note.id 
                                ? 'text-red-600 hover:bg-red-100' 
                                : 'text-green-600 hover:bg-green-100'
                            }`}
                            title={activeNoteId === note.id ? 'جاري التشغيل' : 'تشغيل'}
                          >
                            <Play size={16} />
                          </button>
                          <button
                            onClick={() => handleEditNote(note)}
                            className="p-1.5 text-[#606060] hover:bg-[#e5e5e5] rounded-full transition-colors"
                            title="تعديل"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1.5 text-red-600 hover:bg-red-100 rounded-full transition-colors"
                            title="حذف"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {showDownloadModal && video && (
        <DownloadModal
          videoId={videoId}
          videoTitle={video.title}
          onClose={() => setShowDownloadModal(false)}
        />
      )}

      {backgroundPlayEnabled && video && (
        <BackgroundPlayer
          videoId={videoId}
          videoTitle={video.title}
          thumbnail={video.thumbnail}
          initialTime={currentTime}
          onClose={disableBackgroundPlay}
        />
      )}
    </div>
  );
}
