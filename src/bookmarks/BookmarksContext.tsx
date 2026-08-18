import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from "react";
import {
  fetchBookmarksToolbar,
  isBookmarksApiAvailable,
  subscribeBookmarkChanges,
} from "./bookmarksApi";
import {
  BookmarkNode,
  BookmarksBarAction,
  BookmarksBarContextValue,
  BookmarksBarSettings,
} from "./types";

const SETTINGS_KEY = "bookmarksBarSettings";

const defaultSettings: BookmarksBarSettings = {
  enabled: true,
  appearance: "icon_text",
  position: "bottom",
  style: "glass",
  blur: 10,
};

function loadSettings(): BookmarksBarSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw);
    return { ...defaultSettings, ...parsed };
  } catch {
    return defaultSettings;
  }
}

function persistSettings(settings: BookmarksBarSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

const initialState: BookmarksBarContextValue = {
  settings: defaultSettings,
  bookmarks: [],
  loading: false,
  error: null,
};

const BookmarksContext = createContext<BookmarksBarContextValue>(initialState);
const BookmarksDispatchContext = createContext<
  React.Dispatch<BookmarksBarAction>
>(() => {});

function reducer(
  state: BookmarksBarContextValue,
  action: BookmarksBarAction
): BookmarksBarContextValue {
  switch (action.type) {
    case "UPDATE_SETTINGS": {
      const settings = { ...state.settings, ...action.payload };
      persistSettings(settings);
      return { ...state, settings };
    }
    case "SET_BOOKMARKS":
      return { ...state, bookmarks: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

export function BookmarksProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, (s) => ({
    ...s,
    settings: loadSettings(),
  }));

  const refresh = useCallback(async () => {
    if (!isBookmarksApiAvailable()) {
      dispatch({
        type: "SET_ERROR",
        payload:
          "Bookmarks API is unavailable. This page must run as a browser extension.",
      });
      return;
    }
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "SET_ERROR", payload: null });
    try {
      const nodes = await fetchBookmarksToolbar();
      dispatch({ type: "SET_BOOKMARKS", payload: nodes });
    } catch (e: any) {
      dispatch({
        type: "SET_ERROR",
        payload: e?.message ?? "Failed to load bookmarks",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  useEffect(() => {
    if (!state.settings.enabled) return;
    refresh();
    const unsubscribe = subscribeBookmarkChanges(() => {
      refresh();
    });
    return unsubscribe;
  }, [state.settings.enabled, refresh]);

  return (
    <BookmarksContext.Provider value={state}>
      <BookmarksDispatchContext.Provider value={dispatch}>
        {children}
      </BookmarksDispatchContext.Provider>
    </BookmarksContext.Provider>
  );
}

export const useBookmarks = (): BookmarksBarContextValue =>
  useContext(BookmarksContext);

export const useBookmarksDispatch = () => useContext(BookmarksDispatchContext);

export type { BookmarkNode };
