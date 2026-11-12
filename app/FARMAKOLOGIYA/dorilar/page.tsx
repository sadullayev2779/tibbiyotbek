'use client';

import { useState } from 'react';
import Link from 'next/link';

// Hozircha namunali ma'lumot
const initialDrugs = [
  {
    id: '1',
    name: 'Paratsetamol (Panadol)',
    pharmacologicalGroup: 'Anestetiklar va antipyretics',
    mechanismOfAction: 'Markaziy nerv sistemasida siklooksigenaza (TsOK-3) fermentini inhibe qilib, og‘riq va harorat markazlariga ta\'sir ko‘rsatadi.',
    videoUrl: 'https://www.youtube.com/embed/example',
  },
  {
    id: '2',
    name: 'Amlodipin',
    pharmacologicalGroup: 'Kalsiy kanal blokatorlari',
    mechanismOfAction: 'Qon tomirlari silliq mushak hujayralariga kalsiy ionlari oqimini to‘xtatib, tomirlarni kengaytiradi va qon bosimini tushiradi.',
    videoUrl: 'https://www.youtube.com/embed/example',
  }
];

export default function DrugsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [drugs] = useState(initialDrugs);

  const filteredDrugs = drugs.filter(drug =>
    drug.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    drug.pharmacologicalGroup.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#0a0f1d] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Farmakologiya — Dori Vositalari Bazasi
          </h1>
          <Link href="/farmakologiya/admin" className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-semibold transition">
            + Dori qo'shish (Admin)
          </Link>
        </div>

        {/* Qidiruv paneli */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Dori nomini yoki guruhini kiriting (masalan, Paratsetamol)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 bg-[#111827] border border-cyan-500/30 rounded-xl focus:outline-none focus:border-cyan-400 text-white placeholder-gray-400 shadow-lg"
          />
        </div>

        {/* Dorilar ro'yxati */}
        <div className="grid gap-4">
          {filteredDrugs.map((drug) => (
            <div key={drug.id} className="p-5 bg-[#111827]/80 border border-cyan-500/20 rounded-xl hover:border-cyan-400/50 transition">
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full">
                {drug.pharmacologicalGroup}
              </span>
              <h2 className="text-xl font-bold mt-2 text-cyan-300">{drug.name}</h2>
              <p className="text-gray-300 mt-1 text-sm line-clamp-2">{drug.mechanismOfAction}</p>
              
              <div className="mt-4 flex justify-end">
                <Link href={`/farmakologiya/dorilar/${drug.id}`} className="text-sm text-cyan-400 hover:underline font-medium">
                  Batafsil ko'rish &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}