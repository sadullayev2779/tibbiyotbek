'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toYouTubeEmbedUrl } from '@/lib/video';

type Message = { type: 'success' | 'error'; text: string };

interface Drug {
  id: number;
  name: string;
  pharmacological_group: string | null;
  mechanism_of_action: string | null;
  video_url: string | null;
}

const inputClass =
  'w-full px-4 py-3 bg-[#0b1120] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500';

function errorText(error: { code?: string; message: string }): string {
  return error.code === '42501'
    ? 'Ruxsat yo‘q: bu hisob o‘zgartira olmaydi.'
    : `Amalni bajarib bo‘lmadi: ${error.message}`;
}

export default function AdminDrugsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState('');

  // Forma
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [pharmacologicalGroup, setPharmacologicalGroup] = useState('');
  const [mechanismOfAction, setMechanismOfAction] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  // Ro‘yxat
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  const loadDrugs = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    const { data, error } = await supabase
      .from('drugs')
      .select('id, name, pharmacological_group, mechanism_of_action, video_url')
      .order('created_at', { ascending: false });
    if (error) setListError('Ro‘yxatni yuklab bo‘lmadi.');
    else setDrugs((data ?? []) as Drug[]);
    setListLoading(false);
  }, []);

  useEffect(() => {
    if (session) loadDrugs();
  }, [session, loadDrugs]);

  const filteredDrugs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return drugs;
    return drugs.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.pharmacological_group ?? '').toLowerCase().includes(q)
    );
  }, [drugs, search]);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setPharmacologicalGroup('');
    setMechanismOfAction('');
    setVideoUrl('');
  };

  const startEdit = (drug: Drug) => {
    setEditingId(drug.id);
    setName(drug.name);
    setPharmacologicalGroup(drug.pharmacological_group ?? '');
    setMechanismOfAction(drug.mechanism_of_action ?? '');
    setVideoUrl(drug.video_url ?? '');
    setMessage(null);
    setConfirmDeleteId(null);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
    resetForm();
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

    const payload = {
      name: name.trim(),
      pharmacological_group: pharmacologicalGroup.trim(),
      mechanism_of_action: mechanismOfAction.trim(),
      video_url: embedUrl,
    };

    setSaving(true);

    if (editingId !== null) {
      // select() qaytarmasa, RLS o‘zgartirishga ruxsat bermagan bo‘ladi
      const { data, error } = await supabase
        .from('drugs')
        .update(payload)
        .eq('id', editingId)
        .select('id');
      setSaving(false);

      if (error) {
        setMessage({ type: 'error', text: errorText(error) });
        return;
      }
      if (!data || data.length === 0) {
        setMessage({
          type: 'error',
          text: 'Yangilanmadi: ruxsat yo‘q yoki dori topilmadi. Supabase siyosatlarini (update) tekshiring.',
        });
        return;
      }
      setMessage({ type: 'success', text: 'Dori yangilandi.' });
    } else {
      const { error } = await supabase.from('drugs').insert([payload]);
      setSaving(false);

      if (error) {
        setMessage({ type: 'error', text: errorText(error) });
        return;
      }
      setMessage({ type: 'success', text: 'Dori bazaga qo‘shildi.' });
    }

    resetForm();
    loadDrugs();
  };

  const handleDelete = async (id: number) => {
    setMessage(null);
    setDeletingId(id);
    const { data, error } = await supabase.from('drugs').delete().eq('id', id).select('id');
    setDeletingId(null);
    setConfirmDeleteId(null);

    if (error) {
      setMessage({ type: 'error', text: errorText(error) });
      return;
    }
    if (!data || data.length === 0) {
      setMessage({
        type: 'error',
        text: 'O‘chirilmadi: ruxsat yo‘q yoki dori topilmadi. Supabase siyosatlarini (delete) tekshiring.',
      });
      return;
    }
    if (editingId === id) resetForm();
    setMessage({ type: 'success', text: 'Dori o‘chirildi.' });
    loadDrugs();
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

  const isEditing = editingId !== null;

  return (
    <div className="min-h-screen bg-[#0b1120] text-white p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-cyan-400">Admin panel</h1>
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

        {/* Forma: qo‘shish yoki tahrirlash */}
        <div ref={formRef} className="scroll-mt-6">
          <form
            onSubmit={handleSubmit}
            className={`space-y-5 bg-[#111827] p-6 md:p-8 rounded-2xl border ${
              isEditing ? 'border-cyan-500/50' : 'border-gray-800'
            }`}
          >
            <h2 className="text-lg font-semibold text-white">
              {isEditing ? 'Dorini tahrirlash' : 'Yangi dori qo‘shish'}
            </h2>

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
                Oddiy YouTube havolasini qo‘ying, embed havolaga o‘zi aylantiriladi. Videoni olib
                tashlash uchun maydonni bo‘sh qoldiring.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-3.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold rounded-xl transition cursor-pointer"
              >
                {saving ? 'Saqlanmoqda...' : isEditing ? 'Yangilash' : 'Bazaga saqlash'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-3.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl transition cursor-pointer"
                >
                  Bekor qilish
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Mavjud dorilar */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-cyan-400 mb-4">
            Mavjud dorilar{!listLoading && !listError ? ` (${drugs.length})` : ''}
          </h2>

          <label htmlFor="admin-search" className="sr-only">
            Dori qidirish
          </label>
          <input
            id="admin-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nomi yoki guruhi bo‘yicha qidirish..."
            className="w-full px-4 py-3 mb-4 bg-[#111827] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
          />

          {listLoading ? (
            <p className="text-gray-400 text-sm py-6 text-center">Yuklanmoqda...</p>
          ) : listError ? (
            <div className="text-center py-6 bg-[#111827] rounded-2xl border border-red-500/30">
              <p className="text-red-300 text-sm mb-3">{listError}</p>
              <button
                onClick={loadDrugs}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-xl transition cursor-pointer"
              >
                Qayta yuklash
              </button>
            </div>
          ) : filteredDrugs.length === 0 ? (
            <p className="text-gray-500 text-sm py-6 text-center bg-[#111827] rounded-2xl border border-gray-800">
              {drugs.length === 0 ? 'Bazada hali dori yo‘q.' : 'Hech narsa topilmadi.'}
            </p>
          ) : (
            <ul className="space-y-3">
              {filteredDrugs.map((drug) => (
                <li
                  key={drug.id}
                  className={`p-5 bg-[#111827] rounded-2xl border ${
                    editingId === drug.id ? 'border-cyan-500/50' : 'border-gray-800'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {drug.pharmacological_group && (
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-lg">
                        {drug.pharmacological_group}
                      </span>
                    )}
                    {drug.video_url && (
                      <span className="px-2.5 py-1 bg-cyan-500/10 text-cyan-300 text-xs font-medium rounded-lg">
                        Video bor
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-white">{drug.name}</h3>
                  <p className="text-gray-400 text-sm line-clamp-2 mt-1">
                    {drug.mechanism_of_action}
                  </p>

                  <div className="flex items-center justify-end gap-4 mt-4 text-sm">
                    {confirmDeleteId === drug.id ? (
                      <>
                        <span className="text-red-300 mr-auto">Rostdan o‘chiraymi?</span>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-gray-400 hover:text-white cursor-pointer"
                        >
                          Yo‘q
                        </button>
                        <button
                          onClick={() => handleDelete(drug.id)}
                          disabled={deletingId === drug.id}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg cursor-pointer"
                        >
                          {deletingId === drug.id ? 'O‘chirilmoqda...' : 'Ha, o‘chirish'}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(drug)}
                          className="text-cyan-400 hover:text-cyan-300 cursor-pointer"
                        >
                          Tahrirlash
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(drug.id)}
                          className="text-red-400 hover:text-red-300 cursor-pointer"
                        >
                          O‘chirish
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
