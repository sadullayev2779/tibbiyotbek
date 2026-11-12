'use client';

import Link from 'next/link';

// Kelajakda yangi fanlar (Anatomiya, Patologiya...) qo'shish uchun shu yerga yozib ketasiz
const directions = [
  {
    id: "farmakologiya",
    title: "Farmakologiya",
    description: "Dori-darmonlar mexanizmi, dozalari va klinik qo'llanilishi — interaktiv sxemalar va vizual shpargalkalar bilan.",
    href: "/farmakologiya/dorilar", // Farmakologiya papkasiga yo'naltiramiz
    accent: "cyan",
    icon: "💊",
  },
  {
    id: "anatomiya",
    title: "Anatomiya",
    description: "Inson tanasining tuzilishi — 3D mikroskopik animatsiyalar va qatlamlar bo'yicha chuqur vizual tushuntirishlar.",
    href: "/anatomiya", // Ertaga anatomiya papkasini ochib ulab qo'yasiz
    accent: "emerald",
    icon: "🫀",
  },
  {
    id: "patologiya",
    title: "Patologiya",
    description: "Kasalliklar patogenezi, gistologik o'zgarishlar va klinik sindromlar tahlili.",
    href: "/patologiya", // Ertaga patologiya papkasini ochib ulab qo'yasiz
    accent: "purple",
    icon: "🔬",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0a0f1d] text-white p-6 md:p-12 flex flex-col justify-between">
      <div className="max-w-5xl mx-auto w-full">
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
            Har bir fan bo'yicha chuqur, vizual va amaliy materiallar bitta platformada.
          </p>
        </div>

        {/* Yo'nalishlar Grid (Kartochkalar) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {directions.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group block p-6 bg-[#111827] border border-cyan-500/30 rounded-2xl hover:border-cyan-400 transition shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 group-hover:scale-110 transition">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold text-cyan-300 mb-2 text-center">{item.title}</h3>
                <p className="text-gray-400 text-sm mb-6 text-center">
                  {item.description}
                </p>
              </div>
              <div className="text-center">
                <span className="inline-block px-4 py-2 bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white font-semibold rounded-xl text-xs transition border border-cyan-500/30">
                  Bo'limga o'tish &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-gray-500 mt-12 border-t border-gray-800 pt-6">
        &copy; {new Date().getFullYear()} Tibbiyotbek AI. Barcha huquqlar himoyalangan.
      </footer>
    </main>
  );
}