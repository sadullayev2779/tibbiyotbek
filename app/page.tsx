'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0a0f1d] text-white p-6 md:p-12 flex flex-col justify-between">
      <div className="max-w-4xl mx-auto w-full">
        {/* Header */}
        <header className="flex justify-between items-center mb-12 border-b border-cyan-500/20 pb-6">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 bg-emerald-400 rounded-full animate-ping"></span>
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Tibbiyotbek AI
            </h1>
          </div>
          <span className="text-xs px-3 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-full">
            Klinik Platforma
          </span>
        </header>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-white">
            Tibbiyot yo'nalishlari va <span className="text-cyan-400">Modullar</span>
          </h2>
          <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto">
            Hozircha faqat Farmakologiya bo'limi faol. Kelgusida boshqa fanlar qo'shib boriladi.
          </p>
        </div>

        {/* Farmakologiya Bo'limi */}
        <div className="max-w-xl mx-auto">
          <Link
            href="/farmakologiya /dorilar"
            className="group block p-8 bg-[#111827] border border-cyan-500/30 rounded-2xl hover:border-cyan-400 transition shadow-xl text-center"
          >
            <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 group-hover:scale-110 transition">
              💊
            </div>
            <h3 className="text-2xl font-bold text-cyan-300 mb-2">Farmakologiya</h3>
            <p className="text-gray-400 text-sm mb-6">
              Dori-darmonlar mexanizmi, dozalari va klinik qo'llanilishi — interaktiv sxemalar va vizual shpargalkalar bilan.
            </p>
            <span className="inline-block px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-sm transition">
              Bo'limga o'tish &rarr;
            </span>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-500 mt-12 border-t border-gray-800 pt-6">
        &copy; {new Date().getFullYear()} Tibbiyotbek AI. Barcha huquqlar himoyalangan.
      </footer>
    </main>
  );
}