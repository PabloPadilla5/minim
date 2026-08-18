export type BookmarksBarPosition = "top" | "bottom" | "left" | "right";
export type BookmarksBarAppearance = "icon_text" | "text_only" | "icon_only";
export type BookmarksBarStyle =
  | "solid"
  | "glass"
  | "card"
  | "outline"
  | "transparent";

export interface BookmarksBarSettings {
  enabled: boolean;
  appearance: BookmarksBarAppearance;
  position: BookmarksBarPosition;
  style: BookmarksBarStyle;
  blur: number;
}

export interface BookmarkNode {
  id: string;
  title: string;
  url?: string;
  children?: BookmarkNode[];
}

export interface BookmarksBarContextValue {
  settings: BookmarksBarSettings;
  bookmarks: BookmarkNode[];
  loading: boolean;
  error: string | null;
}

export type BookmarksBarAction =
  | { type: "UPDATE_SETTINGS"; payload: Partial<BookmarksBarSettings> }
  | { type: "SET_BOOKMARKS"; payload: BookmarkNode[] }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null };
