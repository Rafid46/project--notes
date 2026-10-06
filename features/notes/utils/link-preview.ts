"use client";

import type { LinkPreviewMetadata, NoteItem } from "@/features/home/types";

interface YouTubeOEmbedResponse {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
  provider_name?: string;
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .trim();
}

function extractMetaTag(html: string, property: string): string | undefined {
  const patterns = [
    new RegExp(
      `<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${property}["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${property}["']`,
      "i",
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return decodeHtmlEntities(match[1]);
    }
  }

  return undefined;
}

function resolveUrl(relativeOrAbsolute: string, baseUrl: string): string {
  try {
    return new URL(relativeOrAbsolute, baseUrl).href;
  } catch {
    return relativeOrAbsolute;
  }
}

function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.slice(1).split("/")[0].split("?")[0];
      return id.length === 11 ? id : null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      const v = parsed.searchParams.get("v");
      if (v && v.length === 11) return v;
      const parts = parsed.pathname.split("/").filter(Boolean);
      const shortsIndex = parts.indexOf("shorts");
      if (shortsIndex !== -1 && parts[shortsIndex + 1]) {
        return parts[shortsIndex + 1].slice(0, 11);
      }
      const embedIndex = parts.indexOf("embed");
      if (embedIndex !== -1 && parts[embedIndex + 1]) {
        return parts[embedIndex + 1].slice(0, 11);
      }
    }
  } catch {}
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i,
  );
  return match ? match[1] : null;
}

export async function getLinkPreview(
  targetUrl: string,
): Promise<LinkPreviewMetadata | null> {
  if (!targetUrl) return null;

  let url = targetUrl.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return null;
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
    const ytId = extractYouTubeId(url);
    if (ytId) {
      const fallbackYt: LinkPreviewMetadata = {
        url,
        title: "YouTube Video",
        description: "Watch on YouTube",
        image: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
        favicon: "https://www.youtube.com/s/desktop/f17255be/img/favicon.ico",
        siteName: "YouTube",
      };

      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        const res = await fetch(oembedUrl, {
          signal: AbortSignal.timeout(1200),
        });

        if (res.ok) {
          const data = (await res.json()) as YouTubeOEmbedResponse;
          return {
            url,
            title: data.title ? decodeHtmlEntities(data.title) : fallbackYt.title,
            description: data.author_name
              ? `${data.author_name} · YouTube`
              : fallbackYt.description,
            image: data.thumbnail_url || fallbackYt.image,
            favicon: fallbackYt.favicon,
            siteName: data.provider_name || fallbackYt.siteName,
          };
        }
      } catch {}

      return fallbackYt;
    }

    return {
      url,
      title: "YouTube",
      description:
        "Enjoy the videos and music you love, upload original content, and share it all with friends, family, and the world on YouTube.",
      image: "https://www.youtube.com/img/desktop/yt_1200.png",
      favicon: "https://www.youtube.com/s/desktop/f17255be/img/favicon.ico",
      siteName: "YouTube",
    };
  }

  if (hostname.includes("github.com")) {
    const path = parsedUrl.pathname.replace(/^\/+|\/+$/g, "");
    return {
      url,
      title: path ? `${path} · GitHub` : "GitHub",
      description: path ? `View ${path} on GitHub` : "Where the world builds software",
      image: path
        ? `https://opengraph.githubassets.com/1/${path}`
        : "https://github.githubassets.com/images/modules/open_graph/github-logo.png",
      favicon: "https://github.githubassets.com/favicons/favicon.svg",
      siteName: "GitHub",
    };
  }

  const defaultFallback: LinkPreviewMetadata = {
    url,
    title: parsedUrl.hostname.replace(/^www\./, ""),
    description: url,
    image: `https://s0.wp.com/mshots/v1/${encodeURIComponent(url)}?w=600`,
    favicon: `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=128`,
    siteName: parsedUrl.hostname.replace(/^www\./, ""),
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1800);

    const fetchViaCorsProxy = async (): Promise<string> => {
      const res = await fetch(
        `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
        { signal: controller.signal },
      );
      if (!res.ok) throw new Error();
      return res.text();
    };

    const fetchViaAllOrigins = async (): Promise<string> => {
      const res = await fetch(
        `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
        { signal: controller.signal },
      );
      if (!res.ok) throw new Error();
      const json = (await res.json()) as { contents?: string };
      if (!json.contents) throw new Error();
      return json.contents;
    };

    let html = "";
    try {
      html = await Promise.any([fetchViaCorsProxy(), fetchViaAllOrigins()]);
    } catch {
      return defaultFallback;
    } finally {
      clearTimeout(timer);
    }

    if (!html) return defaultFallback;

    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const pageTitle =
      titleMatch && titleMatch[1]
        ? decodeHtmlEntities(titleMatch[1])
        : undefined;

    const title =
      extractMetaTag(html, "og:title") ||
      extractMetaTag(html, "twitter:title") ||
      pageTitle ||
      defaultFallback.title;

    const description =
      extractMetaTag(html, "og:description") ||
      extractMetaTag(html, "twitter:description") ||
      extractMetaTag(html, "description") ||
      defaultFallback.description;

    const rawImage =
      extractMetaTag(html, "og:image") ||
      extractMetaTag(html, "og:image:url") ||
      extractMetaTag(html, "twitter:image") ||
      extractMetaTag(html, "twitter:image:src");

    const image = rawImage
      ? resolveUrl(rawImage, url)
      : defaultFallback.image;

    const siteName =
      extractMetaTag(html, "og:site_name") || defaultFallback.siteName;

    const faviconMatch =
      html.match(
        /<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']*)["']/i,
      ) ||
      html.match(
        /<link[^>]*href=["']([^"']*)["'][^>]*rel=["'](?:shortcut )?icon["']/i,
      );

    const rawFavicon =
      faviconMatch && faviconMatch[1] ? faviconMatch[1] : undefined;
    const favicon = rawFavicon
      ? resolveUrl(rawFavicon, url)
      : defaultFallback.favicon;

    return {
      url,
      title,
      description,
      image,
      favicon,
      siteName,
    };
  } catch {
    return defaultFallback;
  }
}

export function getActiveNote(
  notes: NoteItem[],
  selectedNoteId: string,
): NoteItem | undefined {
  return (
    notes.find((n) => n.id === selectedNoteId) ||
    notes
      .flatMap((n) => n.subNotes || [])
      .find((s) => s.id === selectedNoteId) ||
    notes[0]
  );
}

export function addNoteToState(
  prevNotes: NoteItem[],
  newNoteData: {
    title: string;
    content: string;
    color?: string;
    category?: string;
    parentId: string | null;
    linkPreviews?: NoteItem["linkPreviews"];
    files?: NoteItem["files"];
  },
): NoteItem[] {
  const newNote: NoteItem = {
    id: `note-${Date.now()}`,
    title: newNoteData.title,
    content: newNoteData.content,
    color: newNoteData.color,
    category: newNoteData.category,
    parentId: newNoteData.parentId,
    linkPreviews: newNoteData.linkPreviews,
    files: newNoteData.files,
    subNotes: [],
  };

  if (newNote.parentId) {
    return prevNotes.map((note) => {
      if (note.id === newNote.parentId) {
        return {
          ...note,
          subNotes: [...(note.subNotes || []), newNote],
        };
      }
      return note;
    });
  } else {
    return [...prevNotes, newNote];
  }
}

export function updateNoteInState(
  prevNotes: NoteItem[],
  noteId: string,
  updates: Partial<NoteItem>,
): NoteItem[] {
  return prevNotes.map((note) => {
    if (note.id === noteId) {
      return { ...note, ...updates };
    }
    if (note.subNotes && note.subNotes.length > 0) {
      return {
        ...note,
        subNotes: note.subNotes.map((sub) =>
          sub.id === noteId ? { ...sub, ...updates } : sub,
        ),
      };
    }
    return note;
  });
}

export function extractUrls(text: string): string[] {
  if (!text) return [];
  const urlRegex =
    /(?:https?:\/\/|www\.)[^\s<>"'{}|\\^`]+|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s<>"'{}|\\^`]*)?/gi;
  const matches = text.match(urlRegex);
  if (!matches) return [];
  const valid = matches
    .map((m) => m.trim().replace(/[.,;!?)]+$/, ""))
    .filter((m) => {
      if (
        m.startsWith("http://") ||
        m.startsWith("https://") ||
        m.startsWith("www.")
      )
        return true;
      return m.includes(".") && m.includes("/") && !m.includes("@");
    })
    .map((m) => {
      if (m.startsWith("http://") || m.startsWith("https://")) return m;
      return `https://${m}`;
    });
  return Array.from(new Set(valid));
}
