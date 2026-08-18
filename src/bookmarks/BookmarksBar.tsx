import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@mdi/react";
import { mdiFolder, mdiFolderOpen } from "@mdi/js";
import { useBookmarks } from "./BookmarksContext";
import { BookmarkNode } from "./types";
import { Favicon } from "./Favicon";

function isFolder(node: BookmarkNode): boolean {
  return !node.url;
}

export function BookmarksBar() {
  const { settings, bookmarks, error } = useBookmarks();

  if (!settings.enabled) return null;

  const isVertical =
    settings.position === "left" || settings.position === "right";

  const className = [
    "bookmarks-bar",
    `bookmarks-bar--${settings.position}`,
    `bookmarks-bar--${settings.appearance}`,
    `bookmarks-bar--style-${settings.style}`,
    isVertical ? "bookmarks-bar--vertical" : "bookmarks-bar--horizontal",
  ].join(" ");

  const usesBlur =
    settings.style === "glass" || settings.style === "outline";
  const blurPx = `${Math.max(0, settings.blur)}px`;
  const inlineStyle: React.CSSProperties = usesBlur
    ? ({
        backdropFilter: `blur(${blurPx})`,
        WebkitBackdropFilter: `blur(${blurPx})`,
      } as React.CSSProperties)
    : {};

  return (
    <div
      className={className}
      role="toolbar"
      aria-label="Bookmarks bar"
      style={inlineStyle}
    >
      {error && bookmarks.length === 0 ? (
        <span className="bookmarks-bar__error" title={error}>
          Bookmarks unavailable
        </span>
      ) : bookmarks.length === 0 ? (
        <span className="bookmarks-bar__empty">No bookmarks</span>
      ) : (
        bookmarks.map((node) => (
          <BookmarkItem
            key={node.id}
            node={node}
            appearance={settings.appearance}
            vertical={isVertical}
            position={settings.position}
          />
        ))
      )}
    </div>
  );
}

function BookmarkItem({
  node,
  appearance,
  vertical,
  position,
}: {
  node: BookmarkNode;
  appearance: "icon_text" | "text_only" | "icon_only";
  vertical: boolean;
  position: "top" | "bottom" | "left" | "right";
}) {
  if (isFolder(node)) {
    return (
      <FolderItem
        node={node}
        appearance={appearance}
        vertical={vertical}
        position={position}
      />
    );
  }
  return <LinkItem node={node} appearance={appearance} />;
}

function LinkItem({
  node,
  appearance,
}: {
  node: BookmarkNode;
  appearance: "icon_text" | "text_only" | "icon_only";
}) {
  const showIcon = appearance !== "text_only";
  const showText = appearance !== "icon_only";

  return (
    <a
      className="bookmarks-bar__item bookmarks-bar__item--link"
      href={node.url}
      title={`${node.title}\n${node.url ?? ""}`}
      rel="noopener noreferrer"
    >
      {showIcon && (
        <span className="bookmarks-bar__icon">
          <Favicon url={node.url} />
        </span>
      )}
      {showText && (
        <span className="bookmarks-bar__label">{node.title || node.url}</span>
      )}
    </a>
  );
}

function FolderItem({
  node,
  appearance,
  vertical,
  position,
}: {
  node: BookmarkNode;
  appearance: "icon_text" | "text_only" | "icon_only";
  vertical: boolean;
  position: "top" | "bottom" | "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const showIcon = appearance !== "text_only";

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (containerRef.current?.contains(t)) return;
      if (t?.closest?.(".bookmarks-bar__submenu-popup")) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const menuClass = [
    "bookmarks-bar__menu",
    vertical ? "bookmarks-bar__menu--vertical" : "bookmarks-bar__menu--horizontal",
    `bookmarks-bar__menu--from-${position}`,
  ].join(" ");

  return (
    <div className="bookmarks-bar__folder" ref={containerRef}>
      <button
        type="button"
        className="bookmarks-bar__item bookmarks-bar__item--folder"
        title={node.title}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
      >
        {showIcon && (
          <span className="bookmarks-bar__icon">
            <Icon path={open ? mdiFolderOpen : mdiFolder} size={0.7} />
          </span>
        )}
        <span className="bookmarks-bar__label">{node.title || "Folder"}</span>
      </button>
      {open && (
        <div className={menuClass} role="menu">
          <FolderList nodes={node.children ?? []} appearance={appearance} />
        </div>
      )}
    </div>
  );
}

function FolderList({
  nodes,
  appearance,
}: {
  nodes: BookmarkNode[];
  appearance: "icon_text" | "text_only" | "icon_only";
}) {
  if (nodes.length === 0) {
    return <div className="bookmarks-bar__menu-empty">Empty folder</div>;
  }
  return (
    <ul className="bookmarks-bar__menu-list">
      {nodes.map((child) => (
        <li key={child.id} className="bookmarks-bar__menu-item-wrap">
          {isFolder(child) ? (
            <SubFolderItem node={child} appearance={appearance} />
          ) : (
            <MenuLink node={child} appearance={appearance} />
          )}
        </li>
      ))}
    </ul>
  );
}

function MenuLink({
  node,
  appearance,
}: {
  node: BookmarkNode;
  appearance: "icon_text" | "text_only" | "icon_only";
}) {
  const showIcon = appearance !== "text_only";
  return (
    <a
      className="bookmarks-bar__menu-item"
      href={node.url}
      title={`${node.title}\n${node.url ?? ""}`}
      rel="noopener noreferrer"
    >
      {showIcon && (
        <span className="bookmarks-bar__menu-icon">
          <Favicon url={node.url} />
        </span>
      )}
      <span className="bookmarks-bar__menu-label">
        {node.title || node.url}
      </span>
    </a>
  );
}

const SUBMENU_WIDTH = 240;
const HOVER_OPEN_DELAY_MS = 150;
const HOVER_CLOSE_DELAY_MS = 250;

function SubFolderItem({
  node,
  appearance,
}: {
  node: BookmarkNode;
  appearance: "icon_text" | "text_only" | "icon_only";
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const openTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const showIcon = appearance !== "text_only";

  const clearOpenTimer = () => {
    if (openTimerRef.current !== null) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  };
  const clearCloseTimer = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleOpen = () => {
    clearCloseTimer();
    if (open) return;
    if (openTimerRef.current !== null) return;
    openTimerRef.current = window.setTimeout(() => {
      openTimerRef.current = null;
      setOpen(true);
    }, HOVER_OPEN_DELAY_MS);
  };

  const scheduleClose = () => {
    clearOpenTimer();
    if (!open) return;
    if (closeTimerRef.current !== null) return;
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      setOpen(false);
    }, HOVER_CLOSE_DELAY_MS);
  };

  useEffect(() => {
    return () => {
      clearOpenTimer();
      clearCloseTimer();
    };
  }, []);

  useEffect(() => {
    if (!open || !buttonRef.current) {
      setPos(null);
      return;
    }
    const buttonRect = buttonRef.current.getBoundingClientRect();
    const parentMenu = buttonRef.current.closest(".bookmarks-bar__menu");
    const anchorRect = (parentMenu ?? buttonRef.current).getBoundingClientRect();
    const flipLeft = anchorRect.right + SUBMENU_WIDTH > window.innerWidth;
    const left = flipLeft
      ? Math.max(0, anchorRect.left - SUBMENU_WIDTH)
      : anchorRect.right;
    const maxTop = Math.max(0, window.innerHeight - 40);
    const top = Math.min(buttonRect.top, maxTop);
    setPos({ top, left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        popupRef.current?.contains(t) ||
        buttonRef.current?.contains(t)
      ) {
        return;
      }
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="bookmarks-bar__menu-item bookmarks-bar__menu-item--folder"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={(e) => {
          e.stopPropagation();
          clearOpenTimer();
          clearCloseTimer();
          setOpen((o) => !o);
        }}
        onMouseEnter={scheduleOpen}
        onMouseLeave={scheduleClose}
        onFocus={scheduleOpen}
        title={node.title}
      >
        {showIcon && (
          <span className="bookmarks-bar__menu-icon">
            <Icon path={open ? mdiFolderOpen : mdiFolder} size={0.6} />
          </span>
        )}
        <span className="bookmarks-bar__menu-label">
          {node.title || "Folder"}
        </span>
        <span className="bookmarks-bar__menu-chevron">▸</span>
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={popupRef}
            className="bookmarks-bar__menu bookmarks-bar__submenu-popup"
            role="menu"
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: SUBMENU_WIDTH,
            }}
            onMouseEnter={clearCloseTimer}
            onMouseLeave={scheduleClose}
          >
            <FolderList nodes={node.children ?? []} appearance={appearance} />
          </div>,
          document.body
        )}
    </>
  );
}
