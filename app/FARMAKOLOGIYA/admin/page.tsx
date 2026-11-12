'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function AdminDrugsPage() {
  const [name, setName] = useState('');
  const [pharmacologicalGroup, setPharmacologicalGroup] = useState('');
  const [mechanismOfAction, setMechanismOfAction] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.from('drugs').insert([
        {
          name: name.trim(),
          pharmacological_group: pharmacologicalGroup.trim(),
          mechanism_of_action: mechanismOfAction.trim(),
          video_url: videoUrl.trim() || null,
        },
      ]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Dori bazaga muvaffaqiyatli qo‘shildi!' });
      setName('');
      setPharmacologicalGroup('');
      setMechanismOfAction('');
      setVideoUrl('');
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: `Xatolik yuz berdi: ${err.message || "Ma'lumotni saqlab bo'lmadi"}`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1120] text-white p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-cyan-400">
            Yangi Dori Qo‘shish (Admin)
          </h1>
          <Link
            href="/FARMAKOLOGIYA/dorilar"
            className="text-sm text-gray-400 hover:text-cyan-400 transition"
          >
            &larr; Dorilar ro‘yxatiga qaytish
          </Link>
        </div>

        {message && (
          <div
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
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Dori nomi *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masalan: Paratsetamol (Panadol)"
              className="w-full px-4 py-3 bg-[#0b1120] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Farmakologik guruhi *
            </label>
            <input
              type="text"
              required
              value={pharmacologicalGroup}
              onChange={(e) => setPharmacologicalGroup(e.target.value)}
              placeholder="Masalan: Anestetiklar va antipiretiklar"
              className="w-full px-4 py-3 bg-[#0b1120] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Ta’sir mexanizmi *
            </label>
            <textarea
              required
              rows={4}
              value={mechanismOfAction}
              onChange={(e) => setMechanismOfAction(e.target.value)}
              placeholder="Dorining organizmga qanday ta'sir qilishini yozing..."
              className="w-full px-4 py-3 bg-[#0b1120] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Video havolasi (YouTube Embed URL - ixtiyoriy)
            </label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/embed/..."
              className="w-full px-4 py-3 bg-[#0b1120] border border-gray-700 rounded-xl text-white focus:outline-none focus:border-cyan-500"
            />
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