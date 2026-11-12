'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Drug {
  id: number;
  name: string;
  pharmacological_group: string;
  mechanism_of_action: string;
  video_url?: string | null;
}

export default function DrugsDatabasePage() {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);

  useEffect(() => {
    fetchDrugs();
  }, []);

  const fetchDrugs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('drugs')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDrugs(data);
    }
    setLoading(false);
  };

  const filteredDrugs = drugs.filter(
    (drug) =>
      drug.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drug.pharmacological_group.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0b1120] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        {/* Sarlavha */}
        <div className="mb-8">
          <Link href="/" className="text-xs text-gray-400 hover:text-cyan-400 mb-2 inline-block">
            &larr; Bosh sahifaga qaytish
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-cyan-400">
            Farmakologiya — Dori Vositalari Bazasi
          </h1>
        </div>

        {/* Qidiruv maydoni */}
        <div className="mb-8">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Dori nomini yoki guruhini kiriting (masalan, Paratsetamol)..."
            className="w-full px-5 py-3.5 bg-[#111827] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Dorilar ro'yxati */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Ma’lumotlar yuklanmoqda...</div>
        ) : filteredDrugs.length === 0 ? (
          <div className="text-center py-12 bg-[#111827] rounded-2xl border border-gray-800 text-gray-400">
            Hozircha dori topilmadi.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredDrugs.map((drug) => (
              <div
                key={drug.id}
                className="p-6 bg-[#111827] border border-gray-800 hover:border-cyan-500/40 rounded-2xl transition"
              >
                <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-lg mb-3">
                  {drug.pharmacological_group}
                </span>
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

      {/* Batafsil ko'rish oynasi (Modal) */}
      {selectedDrug && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111827] border border-gray-700 rounded-2xl max-w-2xl w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-lg mb-2">
                  {selectedDrug.pharmacological_group}
                </span>
                <h3 className="text-2xl font-bold text-white">{selectedDrug.name}</h3>
              </div>
              <button
                onClick={() => setSelectedDrug(null)}
                className="text-gray-400 hover:text-white text-2xl leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-2">
                Ta’sir mexanizmi
              </h4>
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                {selectedDrug.mechanism_of_action}
              </p>
            </div>

            {selectedDrug.video_url && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-2">
                  Video tushuntirish
                </h4>
                <div className="aspect-video rounded-xl overflow-hidden border border-gray-800">
                  <iframe
                    src={selectedDrug.video_url}
                    className="w-full h-full"
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