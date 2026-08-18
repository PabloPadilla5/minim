const STORAGE_KEY = "bookmarksFaviconCache";
const MAX_ENTRIES = 200;

type CacheEntry = {
  iconUrl: string;
  usedAt: number;
};

type CacheMap = Record<string, CacheEntry>;

function loadCache(): CacheMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as CacheMap;
  } catch {
    return {};
  }
}

function saveCache(cache: CacheMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // ignore quota errors
  }
}

function trimOldest(cache: CacheMap): CacheMap {
  const entries = Object.entries(cache);
  if (entries.length <= MAX_ENTRIES) return cache;
  entries.sort((a, b) => a[1].usedAt - b[1].usedAt);
  const keep = entries.slice(entries.length - MAX_ENTRIES);
  return Object.fromEntries(keep);
}

export function getCachedFavicon(key: string): string | null {
  const cache = loadCache();
  return cache[key]?.iconUrl ?? null;
}

export function setCachedFavicon(key: string, iconUrl: string) {
  const cache = trimOldest(loadCache());
  cache[key] = { iconUrl, usedAt: Date.now() };
  saveCache(cache);
}

export function clearCachedFavicon(key: string) {
  const cache = loadCache();
  if (!(key in cache)) return;
  delete cache[key];
  saveCache(cache);
}
