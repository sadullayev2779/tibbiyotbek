'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toYouTubeEmbedUrl } from '@/lib/video';

type Message = { type: 'success' | 'error'; text: string };

const inputClass =
  'w-full px-4 py-3 bg-[#0b1120] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500';

export default function AdminDrugsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState('');

  const [name, setName] = useState('');
  const [pharmacologicalGroup, setPharmacologicalGroup] = useState('');
  const [mechanismOfAction, setMechanismOfAction] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckingSession(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    setAuthError('');

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) setAuthError('Email yoki parol noto‘g‘ri.');
    setPassword('');
    setSigningIn(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    let embedUrl: string | null = null;
    if (videoUrl.trim()) {
      embedUrl = toYouTubeEmbedUrl(videoUrl);
      if (!embedUrl) {
        setMessage({
          type: 'error',
          text: 'Video havolasi noto‘g‘ri. YouTube havolasini kiriting (youtube.com/watch?v=... yoki youtu.be/...).',
        });
        return;
      }
    }

    setLoading(true);
    const { error } = await supabase.from('drugs').insert([
      {
        name: name.trim(),
        pharmacological_group: pharmacologicalGroup.trim(),
        mechanism_of_action: mechanismOfAction.trim(),
        video_url: embedUrl,
      },
    ]);
    setLoading(false);

    if (error) {
      setMessage({
        type: 'error',
        text:
          error.code === '42501'
            ? 'Ruxsat yo‘q: bu hisob dori qo‘sha olmaydi.'
            : `Saqlab bo‘lmadi: ${error.message}`,
      });
      return;
    }

    setMessage({ type: 'success', text: 'Dori bazaga qo‘shildi.' });
    setName('');
    setPharmacologicalGroup('');
    setMechanismOfAction('');
    setVideoUrl('');
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#0b1120] text-gray-400 flex items-center justify-center">
        Yuklanmoqda...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0b1120] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#111827] p-8 rounded-2xl border border-gray-800">
          <h1 className="text-2xl font-bold text-cyan-400 mb-2">Admin panelga kirish</h1>
          <p className="text-gray-400 text-sm mb-6">Admin email va parolingizni kiriting.</p>

          {authError && (
            <div
              role="alert"
              className="p-3 rounded-xl mb-4 text-sm bg-red-500/10 border border-red-500/30 text-red-300"
            >
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className={inputClass}
            />
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Parol"
              className={inputClass}
            />
            <button
              type="submit"
              disabled={signingIn}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold rounded-xl transition cursor-pointer"
            >
              {signingIn ? 'Tekshirilmoqda...' : 'Kirish'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/farma/dori" className="text-xs text-gray-500 hover:text-gray-300">
              &larr; Dorilar sahifasiga qaytish
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1120] text-white p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-cyan-400">Yangi dori qo‘shish</h1>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/farma/dori" className="text-gray-400 hover:text-cyan-400 transition">
              &larr; Dorilar ro‘yxati
            </Link>
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-white transition cursor-pointer"
            >
              Chiqish
            </button>
          </div>
        </div>

        {message && (
          <div
            role="status"
            className={`p-4 rounded-xl mb-6 text-sm font-medium ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border border-red-500/30 text-red-300'
            }`}
          >
            {message.text}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-5 bg-[#111827] p-6 md:p-8 rounded-2xl border border-gray-800"
        >
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Dori nomi *
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masalan: Paratsetamol (Panadol)"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="group" className="block text-sm font-medium text-gray-300 mb-2">
              Farmakologik guruhi *
            </label>
            <input
              id="group"
              type="text"
              required
              value={pharmacologicalGroup}
              onChange={(e) => setPharmacologicalGroup(e.target.value)}
              placeholder="Masalan: Analgetiklar va antipiretiklar"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="mechanism" className="block text-sm font-medium text-gray-300 mb-2">
              Ta’sir mexanizmi *
            </label>
            <textarea
              id="mechanism"
              required
              rows={5}
              value={mechanismOfAction}
              onChange={(e) => setMechanismOfAction(e.target.value)}
              placeholder="Dori organizmga qanday ta’sir qilishini yozing..."
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="video" className="block text-sm font-medium text-gray-300 mb-2">
              YouTube havolasi (ixtiyoriy)
            </label>
            <input
              id="video"
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className={inputClass}
            />
            <p className="text-xs text-gray-500 mt-2">
              Oddiy YouTube havolasini qo‘ying, embed havolaga o‘zi aylantiriladi.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold rounded-xl transition cursor-pointer"
          >
            {loading ? 'Saqlanmoqda...' : 'Bazaga saqlash'}
          </button>
        </form>
      </div>
    </div>
  );
}
