// Preview mode for the admin panel's website editor: the site runs in a frame and shows the
// unpublished draft sent by the editor. Off for visitors, and only the admin panel's address
// can send content, so nobody else can make this site display their text.
import { useSyncExternalStore } from "react";

const ADMIN_ORIGINS = [
  import.meta.env.VITE_ADMIN_URL || "https://sky-birds-solutions-admin.vercel.app",
  ...(import.meta.env.DEV ? ["http://localhost:3000"] : []),
].map((url) => new URL(url).origin);

export const isSitePreview =
  typeof window !== "undefined" &&
  window.parent !== window &&
  new URLSearchParams(window.location.search).get("sbPreview") === "1";

let draft = null;
let version = 0;
let editorOrigin = null;
const listeners = new Set();
const waiting = [];

function emit() {
  version += 1;
  listeners.forEach((listener) => listener());
}

// Re-runs a page's content effect whenever the draft changes; always 0 for visitors.
export function useSitePreviewVersion() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => version,
  );
}

// Resolves with the draft in preview mode (null if none arrives, so the page falls back to published text).
export function getPreviewContent() {
  if (draft) return Promise.resolve(draft);
  return new Promise((resolve) => {
    waiting.push(resolve);
    setTimeout(() => resolve(null), 5000);
  });
}

function focusSection(key) {
  document.querySelectorAll(".sb-preview-focus").forEach((el) => el.classList.remove("sb-preview-focus"));
  const target = document.querySelector(`[data-edit~="${CSS.escape(key)}"]`);
  if (!target) return;
  target.classList.add("sb-preview-focus");
  target.scrollIntoView({ behavior: "smooth", block: "center" });
}

if (isSitePreview) {
  const style = document.createElement("style");
  style.textContent = `
    [data-edit] { cursor: pointer; }
    [data-edit]:hover { outline: 2px dashed #6cc04a; outline-offset: -2px; }
    .sb-preview-focus { outline: 3px solid #6cc04a !important; outline-offset: -3px; }
  `;
  document.head.appendChild(style);

  window.addEventListener("message", (event) => {
    if (event.source !== window.parent || !ADMIN_ORIGINS.includes(event.origin)) return;
    const { source, type, content, key } = event.data || {};
    if (source !== "sb-editor") return;
    editorOrigin = event.origin;
    if (type === "content" && content && typeof content === "object") {
      draft = content;
      waiting.splice(0).forEach((resolve) => resolve(draft));
      emit();
    } else if (type === "focus" && typeof key === "string") {
      focusSection(key);
    }
  });

  // A preview only selects sections: links, buttons and forms must not navigate or send anything real.
  const block = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };
  document.addEventListener(
    "click",
    (event) => {
      block(event);
      const section = event.target.closest?.("[data-edit]");
      if (section && editorOrigin) {
        window.parent.postMessage({ source: "sb-preview", type: "select", keys: section.dataset.edit.split(" ") }, editorOrigin);
      }
    },
    true,
  );
  document.addEventListener("submit", block, true);

  ADMIN_ORIGINS.forEach((origin) => window.parent.postMessage({ source: "sb-preview", type: "ready" }, origin));
}
