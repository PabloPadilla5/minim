import { useEffect, useMemo, useState } from "react";
import { Icon } from "@mdi/react";
import { mdiBookmarkOutline } from "@mdi/js";
import {
  clearCachedFavicon,
  getCachedFavicon,
  setCachedFavicon,
} from "./faviconCache";
import { faviconCacheKey, getFaviconSources } from "./faviconSources";

export function Favicon({ url }: { url: string | undefined }) {
  const sources = useMemo(() => getFaviconSources(url), [url]);
  const cacheKey = url ? faviconCacheKey(url) : "";

  const [sourceIndex, setSourceIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const orderedSources = useMemo(() => {
    if (!url || sources.length === 0) return [];
    const cached = getCachedFavicon(cacheKey);
    if (cached && sources.includes(cached)) {
      return [cached, ...sources.filter((s) => s !== cached)];
    }
    return sources;
  }, [url, sources, cacheKey]);

  useEffect(() => {
    setSourceIndex(0);
    setLoaded(false);
  }, [url]);

  const currentSrc = orderedSources[sourceIndex];

  if (!currentSrc) {
    return (
      <span className="bookmarks-bar__icon-placeholder" aria-hidden="true">
        <Icon path={mdiBookmarkOutline} size={0.6} />
      </span>
    );
  }

  return (
    <>
      {!loaded && (
        <span className="bookmarks-bar__icon-placeholder" aria-hidden="true">
          <Icon path={mdiBookmarkOutline} size={0.6} />
        </span>
      )}
      <img
        key={currentSrc}
        src={currentSrc}
        alt=""
        width={16}
        height={16}
        style={loaded ? undefined : { display: "none" }}
        onLoad={() => {
          setLoaded(true);
          setCachedFavicon(cacheKey, currentSrc);
        }}
        onError={() => {
          if (getCachedFavicon(cacheKey) === currentSrc) {
            clearCachedFavicon(cacheKey);
          }
          setLoaded(false);
          setSourceIndex((i) => i + 1);
        }}
      />
    </>
  );
}
