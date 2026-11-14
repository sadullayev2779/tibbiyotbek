import { NextResponse } from 'next/server';

// VAQTINCHALIK: nosozlikni topish uchun. Muammo hal bo‘lgach, shu faylni o‘chiring.
export async function GET() {
  const key = process.env.GEMINI_API_KEY;
  return NextResponse.json({
    hasKey: Boolean(key),
    keyLength: key?.length ?? 0,
    startsWithAIza: key?.startsWith('AIza') ?? false,
    hasWhitespaceOrQuotes: key ? /[\s"']/.test(key) : false,
    model: process.env.GEMINI_MODEL || '(standart: gemini-2.5-flash)',
    hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
  });
}