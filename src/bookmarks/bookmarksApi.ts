import { BookmarkNode } from "./types";

type AnyBookmarksApi = {
  getTree: (...args: any[]) => any;
  getSubTree?: (...args: any[]) => any;
};

function getNativeApi(): AnyBookmarksApi | null {
  const w = window as any;
  if (w.browser?.bookmarks) return w.browser.bookmarks as AnyBookmarksApi;
  if (w.chrome?.bookmarks) return w.chrome.bookmarks as AnyBookmarksApi;
  return null;
}

function callMaybePromise<T>(
  fn: (...args: any[]) => any,
  ...args: any[]
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    try {
      const result = fn(...args, (cbResult: T) => {
        const w = window as any;
        const lastError = w.chrome?.runtime?.lastError;
        if (lastError) {
          reject(new Error(lastError.message ?? "Bookmarks API error"));
        } else {
          resolve(cbResult);
        }
      });
      if (result && typeof result.then === "function") {
        (result as Promise<T>).then(resolve, reject);
      }
    } catch (e) {
      reject(e);
    }
  });
}

function normalize(node: any): BookmarkNode {
  return {
    id: String(node.id),
    title: node.title ?? "",
    url: node.url,
    children: Array.isArray(node.children)
      ? node.children.map(normalize)
      : undefined,
  };
}

const TOOLBAR_CANDIDATE_IDS = ["toolbar_____", "1"];
const TOOLBAR_TITLE_REGEX = /(bookmarks?\s*(bar|toolbar))/i;

export async function fetchBookmarksToolbar(): Promise<BookmarkNode[]> {
  const api = getNativeApi();
  if (!api) {
    return [];
  }

  for (const id of TOOLBAR_CANDIDATE_IDS) {
    if (!api.getSubTree) continue;
    try {
      const subTree = await callMaybePromise<any[]>(api.getSubTree.bind(api), id);
      const root = subTree?.[0];
      if (root?.children) {
        return root.children.map(normalize);
      }
    } catch {
      // Try next candidate id
    }
  }

  try {
    const tree = await callMaybePromise<any[]>(api.getTree.bind(api));
    const root = tree?.[0];
    const children = root?.children ?? [];
    const toolbar =
      children.find((c: any) => TOOLBAR_TITLE_REGEX.test(c.title ?? "")) ??
      children[0];
    if (toolbar?.children) {
      return toolbar.children.map(normalize);
    }
  } catch {
    // ignore
  }

  return [];
}

export function isBookmarksApiAvailable(): boolean {
  return getNativeApi() !== null;
}

export function subscribeBookmarkChanges(callback: () => void): () => void {
  const w = window as any;
  const api = w.browser?.bookmarks ?? w.chrome?.bookmarks;
  if (!api) return () => {};

  const events = [
    "onCreated",
    "onRemoved",
    "onChanged",
    "onMoved",
    "onChildrenReordered",
    "onImportEnded",
  ] as const;

  const unsubscribers: Array<() => void> = [];
  for (const ev of events) {
    const evObj = api[ev];
    if (evObj?.addListener && evObj?.removeListener) {
      const listener = () => callback();
      evObj.addListener(listener);
      unsubscribers.push(() => evObj.removeListener(listener));
    }
  }
  return () => {
    unsubscribers.forEach((u) => u());
  };
}
