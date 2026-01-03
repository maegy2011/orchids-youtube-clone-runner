"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Shield, 
  Settings, 
  List, 
  Tag, 
  Ban,
  Plus,
  Trash2,
  Check,
  X,
  RefreshCw,
  Home,
  Video,
  Users,
  ListVideo,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { ContentFilterConfig, WhitelistItem, AllowedCategory, ContentType } from '@/lib/types';

interface CategoryInfo {
  id: AllowedCategory;
  label: string;
  enabled: boolean;
}

const CATEGORY_LABELS: Record<AllowedCategory, string> = {
  education: 'تعليم',
  islamic: 'إسلامي',
  quran: 'قرآن',
  programming: 'برمجة',
  science: 'علوم',
  documentary: 'وثائقي',
  kids: 'أطفال',
  language: 'لغات',
  history: 'تاريخ',
  health: 'صحة',
  mathematics: 'رياضيات',
  business: 'أعمال',
  cooking: 'طبخ',
  crafts: 'حرف يدوية',
  nature: 'طبيعة',
};

export default function ContentFilterAdminPage() {
  const [config, setConfig] = useState<ContentFilterConfig | null>(null);
  const [categories, setCategories] = useState<CategoryInfo[]>([]);
  const [whitelist, setWhitelist] = useState<WhitelistItem[]>([]);
  const [blockedKeywords, setBlockedKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'settings' | 'categories' | 'whitelist' | 'keywords'>('settings');
  
  const [newWhitelistItem, setNewWhitelistItem] = useState({
    youtubeId: '',
    type: 'video' as ContentType,
    title: '',
    reason: ''
  });
  const [newKeyword, setNewKeyword] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [configRes, categoriesRes, whitelistRes, keywordsRes] = await Promise.all([
        fetch('/api/filter'),
        fetch('/api/filter/categories'),
        fetch('/api/filter/whitelist'),
        fetch('/api/filter/keywords'),
      ]);

      const configData = await configRes.json();
      const categoriesData = await categoriesRes.json();
      const whitelistData = await whitelistRes.json();
      const keywordsData = await keywordsRes.json();

      setConfig(configData.config);
      setCategories(categoriesData.categories || []);
      setWhitelist(whitelistData.whitelist || []);
      setBlockedKeywords(keywordsData.keywords || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleFilterEnabled = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch('/api/filter', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !config.enabled }),
      });
      const data = await res.json();
      setConfig(data.config);
    } catch (error) {
      console.error('Error toggling filter:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleDefaultDeny = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const res = await fetch('/api/filter', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defaultDeny: !config.defaultDeny }),
      });
      const data = await res.json();
      setConfig(data.config);
    } catch (error) {
      console.error('Error toggling default deny:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = async (categoryId: AllowedCategory, enabled: boolean) => {
    setSaving(true);
    try {
      const res = await fetch('/api/filter/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: categoryId, enabled }),
      });
      if (res.ok) {
        setCategories(prev => 
          prev.map(cat => 
            cat.id === categoryId ? { ...cat, enabled } : cat
          )
        );
      }
    } catch (error) {
      console.error('Error toggling category:', error);
    } finally {
      setSaving(false);
    }
  };

  const addToWhitelist = async () => {
    if (!newWhitelistItem.youtubeId || !newWhitelistItem.title) return;
    setSaving(true);
    try {
      const res = await fetch('/api/filter/whitelist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWhitelistItem),
      });
      if (res.ok) {
        const data = await res.json();
        setWhitelist(prev => [...prev, data.item]);
        setNewWhitelistItem({ youtubeId: '', type: 'video', title: '', reason: '' });
      }
    } catch (error) {
      console.error('Error adding to whitelist:', error);
    } finally {
      setSaving(false);
    }
  };

  const removeFromWhitelist = async (youtubeId: string, type: ContentType) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/filter/whitelist?youtubeId=${youtubeId}&type=${type}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setWhitelist(prev => prev.filter(item => !(item.youtubeId === youtubeId && item.type === type)));
      }
    } catch (error) {
      console.error('Error removing from whitelist:', error);
    } finally {
      setSaving(false);
    }
  };

  const addKeyword = async () => {
    if (!newKeyword.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/filter/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: newKeyword.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setBlockedKeywords(data.keywords);
        setNewKeyword('');
      }
    } catch (error) {
      console.error('Error adding keyword:', error);
    } finally {
      setSaving(false);
    }
  };

  const removeKeyword = async (keyword: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/filter/keywords?keyword=${encodeURIComponent(keyword)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        setBlockedKeywords(data.keywords);
      }
    } catch (error) {
      console.error('Error removing keyword:', error);
    } finally {
      setSaving(false);
    }
  };

  const getTypeIcon = (type: ContentType) => {
    switch (type) {
      case 'video': return <Video size={16} />;
      case 'channel': return <Users size={16} />;
      case 'playlist': return <ListVideo size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center" dir="rtl">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white" dir="rtl">
      <header className="bg-[#212121] border-b border-[#3f3f3f] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-red-500" />
            <h1 className="text-xl font-bold">إدارة تصفية المحتوى</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="p-2 hover:bg-[#3f3f3f] rounded-full transition-colors"
              title="تحديث"
            >
              <RefreshCw size={20} />
            </button>
            <Link href="/" className="p-2 hover:bg-[#3f3f3f] rounded-full transition-colors">
              <Home size={20} />
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'settings', label: 'الإعدادات', icon: Settings },
            { id: 'categories', label: 'الفئات', icon: Tag },
            { id: 'whitelist', label: 'القائمة البيضاء', icon: List },
            { id: 'keywords', label: 'الكلمات المحظورة', icon: Ban },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white'
                  : 'bg-[#212121] text-gray-300 hover:bg-[#3f3f3f]'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'settings' && config && (
          <div className="bg-[#212121] rounded-xl p-6 space-y-6">
            <h2 className="text-lg font-bold mb-4">الإعدادات العامة</h2>
            
            <div className="flex items-center justify-between p-4 bg-[#181818] rounded-lg">
              <div>
                <h3 className="font-medium">تفعيل التصفية</h3>
                <p className="text-sm text-gray-400">تشغيل أو إيقاف نظام تصفية المحتوى</p>
              </div>
              <button
                onClick={toggleFilterEnabled}
                disabled={saving}
                className={`p-2 rounded-lg transition-colors ${
                  config.enabled ? 'bg-green-600' : 'bg-gray-600'
                }`}
              >
                {config.enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#181818] rounded-lg">
              <div>
                <h3 className="font-medium">حظر افتراضي</h3>
                <p className="text-sm text-gray-400">حظر كل المحتوى الذي لا يطابق الفئات المسموحة أو القائمة البيضاء</p>
              </div>
              <button
                onClick={toggleDefaultDeny}
                disabled={saving}
                className={`p-2 rounded-lg transition-colors ${
                  config.defaultDeny ? 'bg-red-600' : 'bg-gray-600'
                }`}
              >
                {config.defaultDeny ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-[#181818] p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-500">{whitelist.length}</p>
                <p className="text-sm text-gray-400">في القائمة البيضاء</p>
              </div>
              <div className="bg-[#181818] p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-500">{categories.filter(c => c.enabled).length}</p>
                <p className="text-sm text-gray-400">فئات مسموحة</p>
              </div>
              <div className="bg-[#181818] p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-yellow-500">{blockedKeywords.length}</p>
                <p className="text-sm text-gray-400">كلمات محظورة</p>
              </div>
              <div className="bg-[#181818] p-4 rounded-lg text-center">
                <p className="text-2xl font-bold text-blue-500">{config.enabled ? 'نشط' : 'معطل'}</p>
                <p className="text-sm text-gray-400">حالة النظام</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="bg-[#212121] rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4">الفئات المسموحة</h2>
            <p className="text-sm text-gray-400 mb-6">المحتوى الذي يطابق هذه الفئات سيُسمح به تلقائياً</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(category => (
                <div
                  key={category.id}
                  className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                    category.enabled ? 'bg-green-900/30 border border-green-600' : 'bg-[#181818] border border-transparent'
                  }`}
                >
                  <span className="font-medium">{category.label}</span>
                  <button
                    onClick={() => toggleCategory(category.id, !category.enabled)}
                    disabled={saving}
                    className={`p-1.5 rounded-lg transition-colors ${
                      category.enabled ? 'bg-green-600' : 'bg-gray-600'
                    }`}
                  >
                    {category.enabled ? <Check size={18} /> : <X size={18} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'whitelist' && (
          <div className="bg-[#212121] rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4">القائمة البيضاء</h2>
            <p className="text-sm text-gray-400 mb-6">المحتوى المُضاف هنا سيُسمح به بغض النظر عن قواعد التصفية</p>

            <div className="bg-[#181818] rounded-lg p-4 mb-6">
              <h3 className="font-medium mb-4">إضافة عنصر جديد</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <select
                  value={newWhitelistItem.type}
                  onChange={e => setNewWhitelistItem(prev => ({ ...prev, type: e.target.value as ContentType }))}
                  className="bg-[#0f0f0f] border border-[#3f3f3f] rounded-lg px-3 py-2 text-white"
                >
                  <option value="video">فيديو</option>
                  <option value="channel">قناة</option>
                  <option value="playlist">قائمة تشغيل</option>
                </select>
                <input
                  type="text"
                  value={newWhitelistItem.youtubeId}
                  onChange={e => setNewWhitelistItem(prev => ({ ...prev, youtubeId: e.target.value }))}
                  placeholder="معرف YouTube"
                  className="bg-[#0f0f0f] border border-[#3f3f3f] rounded-lg px-3 py-2 text-white"
                />
                <input
                  type="text"
                  value={newWhitelistItem.title}
                  onChange={e => setNewWhitelistItem(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="العنوان"
                  className="bg-[#0f0f0f] border border-[#3f3f3f] rounded-lg px-3 py-2 text-white"
                />
                <button
                  onClick={addToWhitelist}
                  disabled={saving || !newWhitelistItem.youtubeId || !newWhitelistItem.title}
                  className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg px-4 py-2 transition-colors"
                >
                  <Plus size={18} />
                  إضافة
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {whitelist.length === 0 ? (
                <p className="text-center text-gray-400 py-8">القائمة البيضاء فارغة</p>
              ) : (
                whitelist.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-[#181818] rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">{getTypeIcon(item.type)}</span>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-gray-400">{item.youtubeId}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromWhitelist(item.youtubeId, item.type)}
                      disabled={saving}
                      className="p-2 text-red-500 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'keywords' && (
          <div className="bg-[#212121] rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4">الكلمات المحظورة</h2>
            <p className="text-sm text-gray-400 mb-6">المحتوى الذي يحتوي على هذه الكلمات سيُحظر</p>

            <div className="flex gap-4 mb-6">
              <input
                type="text"
                value={newKeyword}
                onChange={e => setNewKeyword(e.target.value)}
                placeholder="أدخل كلمة محظورة"
                className="flex-1 bg-[#181818] border border-[#3f3f3f] rounded-lg px-4 py-2 text-white"
                onKeyDown={e => e.key === 'Enter' && addKeyword()}
              />
              <button
                onClick={addKeyword}
                disabled={saving || !newKeyword.trim()}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg px-4 py-2 transition-colors"
              >
                <Plus size={18} />
                إضافة
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {blockedKeywords.length === 0 ? (
                <p className="text-gray-400">لا توجد كلمات محظورة</p>
              ) : (
                blockedKeywords.map(keyword => (
                  <span
                    key={keyword}
                    className="flex items-center gap-2 bg-red-900/30 border border-red-600 px-3 py-1.5 rounded-full"
                  >
                    {keyword}
                    <button
                      onClick={() => removeKeyword(keyword)}
                      disabled={saving}
                      className="hover:text-red-400 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}