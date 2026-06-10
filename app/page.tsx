import Link from "next/link";

const directions = [
  {
    id: "farmakologiya",
    title: "Farmakologiya",
    description:
      "Dori-darmonlar mexanizmi, dozalari va klinik qo'llanilishi — interaktiv sxemalar va vizual shpargalkalar bilan.",
    accent: "cyan",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10" aria-hidden>
        <rect
          x="18"
          y="8"
          width="12"
          height="32"
          rx="6"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M24 8V4M20 4h8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="24" cy="28" r="4" fill="currentColor" opacity="0.6" />
        <path
          d="M14 36c2-4 6-6 10-6s8 2 10 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>
    ),
  },
  {
    id: "anatomiya",
    title: "Anatomiya",
    description:
      "Inson tanasining tuzilishi — 3D mikroskopik animatsiyalar va qatlamlar bo'yicha chuqur vizual tushuntirishlar.",
    accent: "emerald",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10" aria-hidden>
        <path
          d="M24 6c-6 8-10 16-10 24a10 10 0 0 0 20 0c0-8-4-16-10-24Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M24 18v16M18 26h12M20 32h8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
        />
      </svg>
    ),
  },
  {
    id: "patologiya",
    title: "Patologiya",
    description:
      "Kasalliklar patogenezi, gistologik o'zgarishlar va klinik holatlar — real vizuallar asosida tahlil qiling.",
    accent: "teal",
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10" aria-hidden>
        <circle cx="24" cy="24" r="16" stroke="currentColor" strokeWidth="2" />
        <circle cx="24" cy="24" r="6" stroke="currentColor" strokeWidth="2" />
        <path
          d="M24 8v8M24 32v8M8 24h8M32 24h8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />
        <circle cx="30" cy="18" r="2" fill="currentColor" opacity="0.7" />
        <circle cx="16" cy="30" r="2" fill="currentColor" opacity="0.7" />
      </svg>
    ),
  },
] as const;

const accentStyles = {
  cyan: {
    border: "border-cyan-500/30 hover:border-cyan-400/60",
    glow: "group-hover:shadow-[0_0_40px_-8px_rgba(34,211,238,0.5)]",
    icon: "text-cyan-400",
    badge: "bg-cyan-500/10 text-cyan-300 ring-cyan-500/20",
    gradient: "from-cyan-500/20 via-cyan-500/5 to-transparent",
  },
  emerald: {
    border: "border-emerald-500/30 hover:border-emerald-400/60",
    glow: "group-hover:shadow-[0_0_40px_-8px_rgba(52,211,153,0.5)]",
    icon: "text-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20",
    gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent",
  },
  teal: {
    border: "border-teal-500/30 hover:border-teal-400/60",
    glow: "group-hover:shadow-[0_0_40px_-8px_rgba(45,212,191,0.5)]",
    icon: "text-teal-400",
    badge: "bg-teal-500/10 text-teal-300 ring-teal-500/20",
    gradient: "from-teal-500/20 via-teal-500/5 to-transparent",
  },
};

const features = [
  { label: "3D mikroskopik animatsiyalar", icon: "◈" },
  { label: "Vizual shpargalkalar", icon: "◇" },
  { label: "O'quv qo'llanmalari", icon: "◎" },
];

export default function Home() {
  return (
    <div className="relative min-h-full overflow-hidden bg-[#030712] text-slate-100">
      {/* Background layers */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(34,211,238,0.15),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_60%,rgba(52,211,153,0.08),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(148,163,184,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,163,184,0.5) 1px, transparent 1px)`,
          backgroundSize: "64px 64px",
        }}
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-full max-w-6xl flex-col px-6 pb-20 pt-8 sm:px-10 lg:px-12">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 ring-1 ring-cyan-400/30">
              <span className="text-lg font-bold text-cyan-300">T</span>
              <div className="absolute inset-0 rounded-xl bg-cyan-400/10 blur-md" />
            </div>
            <span className="text-sm font-semibold tracking-wide text-slate-300">
              Tibbiyotbek <span className="text-cyan-400">AI</span>
            </span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-slate-400 sm:flex">
            <span className="cursor-default transition-colors hover:text-cyan-300">
              Kurslar
            </span>
            <span className="cursor-default transition-colors hover:text-emerald-300">
              Shpargalkalar
            </span>
            <span className="cursor-default transition-colors hover:text-teal-300">
              Qo&apos;llanmalar
            </span>
          </nav>
        </header>

        {/* Hero */}
        <main className="mt-16 flex flex-1 flex-col items-center text-center sm:mt-24">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 text-xs font-medium tracking-wider text-cyan-300 uppercase ring-1 ring-cyan-500/10">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Tibbiyot ta&apos;limi — yangi avlod
          </div>

          <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
              Tibbiyotbek
            </span>{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              AI
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-400 sm:text-xl">
            Tibbiyot talabalari uchun oliy darajadagi darslar, 3D mikroskopik
            animatsiyalar, shpargalkalar va vizuallashgan o&apos;quv
            qo&apos;llanmalari — barchasi bir platformada.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <Link
              href="/kurslar"
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 px-8 py-3.5 text-base font-semibold text-slate-950 shadow-[0_0_32px_-4px_rgba(34,211,238,0.5)] transition-all hover:shadow-[0_0_48px_-4px_rgba(52,211,153,0.6)] hover:brightness-110"
            >
              <span>Kurslarni ko&apos;rish</span>
              <svg
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </div>

          {/* Feature pills */}
          <ul className="mt-14 flex flex-wrap justify-center gap-3">
            {features.map((feature) => (
              <li
                key={feature.label}
                className="flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-800/40 px-4 py-2 text-sm text-slate-300 backdrop-blur-sm"
              >
                <span className="text-cyan-400">{feature.icon}</span>
                {feature.label}
              </li>
            ))}
          </ul>
        </main>

        {/* Direction cards */}
        <section className="mt-24 sm:mt-32" aria-labelledby="directions-heading">
          <div className="mb-10 text-center">
            <h2
              id="directions-heading"
              className="text-2xl font-semibold tracking-tight text-white sm:text-3xl"
            >
              Asosiy yo&apos;nalishlar
            </h2>
            <p className="mt-3 text-slate-400">
              Har bir fan bo&apos;yicha chuqur, vizual va amaliy materiallar
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {directions.map((direction) => {
              const style = accentStyles[direction.accent];
              return (
                <article
                  key={direction.id}
                  className={`group relative overflow-hidden rounded-2xl border bg-slate-900/50 p-6 backdrop-blur-sm transition-all duration-300 ${style.border} ${style.glow}`}
                >
                  <div
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                    aria-hidden
                  />
                  <div className="relative">
                    <div
                      className={`mb-5 inline-flex rounded-xl bg-slate-800/80 p-3 ring-1 ring-inset ring-slate-700/50 ${style.icon}`}
                    >
                      {direction.icon}
                    </div>
                    <span
                      className={`mb-3 inline-block rounded-md px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style.badge}`}
                    >
                      {direction.title}
                    </span>
                    <h3 className="text-xl font-semibold text-white">
                      {direction.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-400">
                      {direction.description}
                    </p>
                    <div className="mt-6 flex items-center gap-1.5 text-sm font-medium text-slate-300 transition-colors group-hover:text-white">
                      <span>Batafsil</span>
                      <svg
                        className="h-4 w-4 transition-transform group-hover:translate-x-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Footer accent */}
        <footer className="mt-20 border-t border-slate-800/80 pt-8 text-center text-sm text-slate-500">
          <p>
            © {new Date().getFullYear()} Tibbiyotbek AI — Tibbiyot ta&apos;limi
            kelajagi
          </p>
        </footer>
      </div>
    </div>
  );
}
