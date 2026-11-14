'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { toYouTubeEmbedUrl } from '@/lib/video';

interface Drug {
  id: number;
  name: string;
  pharmacological_group: string | null;
  mechanism_of_action: string | null;
  video_url: string | null;
}

export default function DrugsDatabasePage() {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);

  const fetchDrugs = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('drugs')
      .select('id, name, pharmacological_group, mechanism_of_action, video_url')
      .order('created_at', { ascending: false });

    if (error) {
      setError('Ma’lumotlarni yuklab bo‘lmadi. Internetni tekshirib, qayta urinib ko‘ring.');
    } else {
      setDrugs((data ?? []) as Drug[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDrugs();
  }, [fetchDrugs]);

  // Escape bosilganda oynani yopish
  useEffect(() => {
    if (!selectedDrug) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedDrug(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedDrug]);

  const filteredDrugs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return drugs;
    return drugs.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.pharmacological_group ?? '').toLowerCase().includes(q) ||
        (d.mechanism_of_action ?? '').toLowerCase().includes(q)
    );
  }, [drugs, searchQuery]);

  const embedUrl = selectedDrug ? toYouTubeEmbedUrl(selectedDrug.video_url) : null;

  return (
    <div className="min-h-screen bg-[#0b1120] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <Link href="/" className="text-xs text-gray-400 hover:text-cyan-400">
              &larr; Bosh sahifaga qaytish
            </Link>
            <Link
              href="/farma/ai"
              className="text-xs px-3 py-1.5 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 rounded-lg transition"
            >
              AI yordamchi
            </Link>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-cyan-400">
            Farmakologiya — Dori vositalari bazasi
          </h1>
        </div>

        <div className="mb-8">
          <label htmlFor="drug-search" className="sr-only">
            Dori qidirish
          </label>
          <input
            id="drug-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Dori nomi yoki guruhini kiriting (masalan, Paratsetamol)..."
            className="w-full px-5 py-3.5 bg-[#111827] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
          />
          {!loading && !error && drugs.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              {searchQuery.trim()
                ? `${filteredDrugs.length} ta natija (jami ${drugs.length} ta dori)`
                : `Jami ${drugs.length} ta dori`}
            </p>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Ma’lumotlar yuklanmoqda...</div>
        ) : error ? (
          <div className="text-center py-12 bg-[#111827] rounded-2xl border border-red-500/30">
            <p className="text-red-300 text-sm mb-4">{error}</p>
            <button
              onClick={fetchDrugs}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold rounded-xl transition cursor-pointer"
            >
              Qayta yuklash
            </button>
          </div>
        ) : filteredDrugs.length === 0 ? (
          <div className="text-center py-12 bg-[#111827] rounded-2xl border border-gray-800 text-gray-400">
            {drugs.length === 0
              ? 'Hozircha bazada dori yo‘q.'
              : 'Bu so‘rov bo‘yicha dori topilmadi. Boshqacha yozib ko‘ring.'}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDrugs.map((drug) => (
              <div
                key={drug.id}
                className="p-6 bg-[#111827] border border-gray-800 hover:border-cyan-500/40 rounded-2xl transition"
              >
                {drug.pharmacological_group && (
                  <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-lg mb-3">
                    {drug.pharmacological_group}
                  </span>
                )}
                <h2 className="text-xl font-bold text-white mb-2">{drug.name}</h2>
                <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                  {drug.mechanism_of_action}
                </p>
                <div className="flex justify-end">
                  <button
                    onClick={() => setSelectedDrug(drug)}
                    className="text-sm text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
                  >
                    Batafsil ko‘rish &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedDrug && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedDrug(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="drug-title"
            onClick={(e) => e.stopPropagation()}
            className="bg-[#111827] border border-gray-700 rounded-2xl max-w-2xl w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                {selectedDrug.pharmacological_group && (
                  <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-lg mb-2">
                    {selectedDrug.pharmacological_group}
                  </span>
                )}
                <h3 id="drug-title" className="text-2xl font-bold text-white">
                  {selectedDrug.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDrug(null)}
                aria-label="Yopish"
                className="text-gray-400 hover:text-white text-2xl leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            {selectedDrug.mechanism_of_action && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-cyan-400 mb-2">Ta’sir mexanizmi</h4>
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                  {selectedDrug.mechanism_of_action}
                </p>
              </div>
            )}

            {embedUrl && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-cyan-400 mb-2">Video tushuntirish</h4>
                <div className="aspect-video rounded-xl overflow-hidden border border-gray-800">
                  <iframe
                    src={embedUrl}
                    title={`${selectedDrug.name} — video tushuntirish`}
                    className="w-full h-full"
                    loading="lazy"
                    allow="encrypted-media; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedDrug(null)}
              className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-medium transition cursor-pointer"
            >
              Yopish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
