/**
 * YouTube havolasini (watch, youtu.be, shorts, embed) xavfsiz embed manzilga aylantiradi.
 * YouTube bo‘lmagan yoki noto‘g‘ri havola uchun null qaytaradi.
 */
export function toYouTubeEmbedUrl(input: string | null | undefined): string | null {
    const raw = input?.trim();
    if (!raw) return null;
  
    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      return null;
    }
  
    const host = url.hostname.replace(/^(www|m)\./, '');
    let id: string | null = null;
  
    if (host === 'youtu.be') {
      id = url.pathname.slice(1).split('/')[0] || null;
    } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (url.pathname === '/watch') {
        id = url.searchParams.get('v');
      } else {
        const match = url.pathname.match(/^\/(embed|shorts|live)\/([^/?]+)/);
        if (match) id = match[2];
      }
    }
  
    if (!id || !/^[\w-]{11}$/.test(id)) return null;
    return `https://www.youtube-nocookie.com/embed/${id}`;
  }
  