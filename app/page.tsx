'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0b1120] text-white p-6 md:p-12 flex flex-col justify-between">
      <div className="max-w-4xl mx-auto w-full pt-12">
        {/* Sarlavha */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-cyan-400 mb-4">
            Tibbiyotbek Platformasi
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            Talabalar uchun zamonaviy tibbiy ta'lim va ma'lumotlar bazasi
          </p>
        </div>

        {/* Farmakologiya Bo'limi */}
        <div className="max-w-xl mx-auto">
          <Link
            href="/farma/dori"
            className="group block p-8 bg-[#111827] border border-cyan-500/30 rounded-2xl hover:border-cyan-500 transition shadow-lg hover:shadow-cyan-500/10"
          >
            <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 text-2xl mb-6 group-hover:scale-110 transition">
              💊
            </div>
            <h2 className="text-2xl font-bold text-cyan-300 mb-2">Farmakologiya</h2>
            <p className="text-gray-400 text-sm mb-6">
              Dori-darmonlar mexanizmi, dozalari va klinik qo‘llanilishi — interaktiv sxemalar va videolar.
            </p>
            <span className="inline-block px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-sm transition">
              Bo‘limga o‘tish &rarr;
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