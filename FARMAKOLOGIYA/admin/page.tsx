'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AdminPage() {
  const [name, setName] = useState('');
  const [group, setGroup] = useState('');
  const [mechanism, setMechanism] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [successMessage, setSuccessMessage] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Bu yerda kelgusida ma'lumotlar bazasiga saqlash amallari bajariladi
    console.log({ name, group, mechanism, videoUrl });
    setSuccessMessage(true);
    setName('');
    setGroup('');
    setMechanism('');
    setVideoUrl('');
    setTimeout(() => setSuccessMessage(false), 3000);
  };

  const handleClear = () => {
    setName('');
    setGroup('');
    setMechanism('');
    setVideoUrl('');
    setSuccessMessage(false);
  };

  return (
    <main className="min-h-screen bg-[#0a0f1d] text-white p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Admin Panel — Dori Qo'shish
          </h1>
          <Link href="/farmakologiya/dorilar" className="text-sm text-cyan-400 hover:underline">
            &larr; Dorilar ro'yxatiga qaytish
          </Link>
        </div>

        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500 text-emerald-300 rounded-xl">
            Dori muvaffaqiyatli qo'shildi!
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-[#111827] border border-cyan-500/20 p-6 rounded-2xl shadow-xl space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Dorining nomi</label>
            <input
              type="text"
              required
              placeholder="Masalan: Paratsetamol"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-[#0a0f1d] border border-cyan-500/30 rounded-xl focus:outline-none focus:border-cyan-400 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Farmakologik guruhi</label>
            <input
              type="text"
              required
              placeholder="Masalan: Anestetiklar va antipyretics"
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className="w-full px-4 py-3 bg-[#0a0f1d] border border-cyan-500/30 rounded-xl focus:outline-none focus:border-cyan-400 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Ta'sir mexanizmi (Tavsif)</label>
            <textarea
              required
              rows={4}
              placeholder="Dorining organizmdagi ta'sir mexanizmini yozing..."
              value={mechanism}
              onChange={(e) => setMechanism(e.target.value)}
              className="w-full px-4 py-3 bg-[#0a0f1d] border border-cyan-500/30 rounded-xl focus:outline-none focus:border-cyan-400 text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Video havola (YouTube yoki 3D video linki)</label>
            <input
              type="url"
              placeholder="https://www.youtube.com/embed/..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full px-4 py-3 bg-[#0a0f1d] border border-cyan-500/30 rounded-xl focus:outline-none focus:border-cyan-400 text-white"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-gray-950 font-bold rounded-xl hover:opacity-90 transition shadow-lg"
            >
              Dorini saqlash
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="px-6 py-3 bg-gray-800 text-gray-300 font-bold rounded-xl hover:bg-gray-700 transition"
            >
              Tozalash
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}