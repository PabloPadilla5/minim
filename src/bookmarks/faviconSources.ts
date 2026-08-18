function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.+$/, "");
  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host === "::1") {
    return true;
  }
  if (host.endsWith(".local") || host.endsWith(".localhost")) {
    return true;
  }
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 169 && b === 254) return true;
  }
  return false;
}

function knownProductIcon(parsed: URL): string | null {
  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname.toLowerCase();

  if (host === "docs.google.com" || host === "www.docs.google.com") {
    if (path.startsWith("/spreadsheets")) {
      return "https://ssl.gstatic.com/docs/spreadsheets/favicon3.ico";
    }
    if (path.startsWith("/presentation")) {
      return "https://ssl.gstatic.com/docs/presentations/images/favicon5.ico";
    }
    if (path.startsWith("/forms")) {
      return "https://ssl.gstatic.com/docs/forms/favicon_all_16.png";
    }
    if (path.startsWith("/document") || path.startsWith("/docs")) {
      return "https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico";
    }
  }

  if (host === "drive.google.com" || host === "www.drive.google.com") {
    return "https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png";
  }

  if (
    host === "mail.google.com" ||
    host === "inbox.google.com" ||
    (host === "gmail.com" && path.length <= 1)
  ) {
    return "https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico";
  }

  if (host === "calendar.google.com") {
    return "https://calendar.google.com/googlecalendar/images/favicons/v1/favicon.ico";
  }

  if (host === "meet.google.com") {
    return "https://fonts.gstatic.com/s/i/productlogos/meet_2020q4/v6/web-24dp/logo_meet_2020q4_color_1x_web_24dp.png";
  }

  if (host === "sheets.google.com") {
    return "https://ssl.gstatic.com/docs/spreadsheets/favicon3.ico";
  }

  if (host === "slides.google.com") {
    return "https://ssl.gstatic.com/docs/presentations/images/favicon5.ico";
  }

  return null;
}

function gstaticFaviconV2(url: string): string {
  return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(
    url
  )}&size=32`;
}

function duckDuckGoIcon(hostname: string): string {
  return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(hostname)}.ico`;
}

function googleS2Domain(hostname: string): string {
  return `https://www.google.com/s2/favicons?sz=32&domain=${encodeURIComponent(
    hostname
  )}`;
}

export function getFaviconSources(url: string | undefined): string[] {
  if (!url) return [];
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return [];
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return [];
  }

  const sources: string[] = [];
  const seen = new Set<string>();
  const push = (src: string | null) => {
    if (!src || seen.has(src)) return;
    seen.add(src);
    sources.push(src);
  };

  if (isPrivateHost(parsed.hostname)) {
    push(`${parsed.origin}/favicon.ico`);
    push(`${parsed.origin}/favicon.png`);
    const dir = parsed.pathname.replace(/\/[^/]*$/, "");
    if (dir && dir !== "/") {
      push(`${parsed.origin}${dir}/favicon.ico`);
    }
    return sources;
  }

  push(knownProductIcon(parsed));
  push(gstaticFaviconV2(url));
  push(duckDuckGoIcon(parsed.hostname));
  push(googleS2Domain(parsed.hostname));
  return sources;
}

export function faviconCacheKey(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host.endsWith("docs.google.com") || host.endsWith("drive.google.com")) {
      const first = parsed.pathname.split("/").filter(Boolean)[0] ?? "";
      return `${parsed.origin}/${first}`;
    }
    return url;
  } catch {
    return url;
  }
}
