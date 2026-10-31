import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, CheckCircle, ChevronDown, ChevronRight, ExternalLink, History, Loader2, Monitor, RotateCcw, Smartphone, Trash2, Upload, X } from "lucide-react";
import API from "../api/axios";
import { ConfirmModal } from "../components/CourseModules";
import { ObjectEditor, SITE_URL, formatLabel } from "../components/ContentFields";

const SITE_ORIGIN = new URL(SITE_URL).origin;
const AUTOSAVE_MS = 1200;
const DESKTOP_WIDTH = 1280;
const PHONE_WIDTH = 390;

// sections: the order to list them. Sections and fields the site doesn't display are left out, but stay saved.
const PAGES = [
  { id: "home", label: "Home", route: "/", root: "home", sections: ["hero", "featured", "sectionsIntro", "contentSections", "learning", "faq", "faqs", "cta"] },
  { id: "about", label: "About", route: "/about", root: "about", sections: ["trainer", "hero", "promisesIntro", "promises", "who", "vision", "mission", "services", "servicesList", "impact", "stats", "cta"] },
  { id: "contact", label: "Contact & footer", route: "/contact", root: "support", sections: ["contactPage", "footer"] },
  { id: "privacy", label: "Privacy", route: "/privacy-policy", root: "legal", field: "privacy" },
  { id: "terms", label: "Terms", route: "/terms", root: "legal", field: "terms" },
  { id: "seo", label: "SEO", route: null, root: "seo" },
];

const HIDDEN_FIELDS = {
  "home.hero": ["badge", "secondaryCta"],
  "home.featured": ["eyebrow"],
  "home.learning": ["eyebrow"],
  "home.faq": ["eyebrow"],
  "home.cta": ["eyebrow", "primaryLabel"],
};

const SEARCH_PAGES = ["home", "about", "contact", "courses", "default"];

const pageForKey = (key) => {
  const [root, field] = key.split(".");
  return PAGES.find((page) => page.root === root && (!page.field || page.field === field));
};

const when = (date) => (date ? new Date(date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "");

function SearchPreview({ title, description }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="truncate text-xs text-gray-500">sky-birds-solutions.vercel.app</p>
      <p className="mt-1 truncate text-lg text-[#1a0dab]">{title || "No title"}</p>
      <p className="mt-1 line-clamp-2 text-sm text-gray-600">{description || "No description"}</p>
      <p className={`mt-2 text-xs ${(title || "").length > 60 || (description || "").length > 160 ? "font-medium text-amber-700" : "text-gray-400"}`}>
        Title {(title || "").length}/60 · Description {(description || "").length}/160. Google may cut off longer text.
      </p>
    </div>
  );
}

function LivePreview({ frameRef, route, device, frameKey, connected }) {
  const boxRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(boxRef.current);
    return () => observer.disconnect();
  }, []);

  // The real desktop layout is drawn full size and scaled down to fit the panel.
  const width = device === "phone" ? PHONE_WIDTH : DESKTOP_WIDTH;
  const scale = size.width ? Math.min(1, size.width / width) : 1;

  return (
    <div ref={boxRef} className="relative h-full min-h-[60vh] overflow-hidden bg-gray-100">
      <iframe
        key={frameKey}
        ref={frameRef}
        src={`${SITE_URL}${route}?sbPreview=1`}
        title="Website preview"
        className="absolute left-1/2 top-0 origin-top border-0 bg-white"
        style={{ width, height: scale ? size.height / scale : "100%", transform: `translateX(-50%) scale(${scale})` }}
      />
      {connected === false && (
        <div className="absolute inset-x-3 top-3 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 shadow">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          The preview isn't connected, so it may not show your edits. Deploy the latest website, or reload this page. Saving and publishing still work.
        </div>
      )}
    </div>
  );
}

function HistoryPanel({ versions, onRestore, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" role="dialog" aria-modal="true" aria-label="Publish history" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Publish history</h2>
            <p className="text-xs text-gray-500">Each entry is the website as it was before a publish.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close history" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {versions === null ? (
            <Loader2 className="mx-auto mt-8 h-6 w-6 animate-spin text-gray-400" />
          ) : versions.length === 0 ? (
            <p className="mt-8 text-center text-sm text-gray-500">Nothing yet. A copy is kept each time you publish.</p>
          ) : (
            versions.map((version) => (
              <div key={version._id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{when(version.createdAt)}</p>
                  <p className="truncate text-xs text-gray-500">{version.replacedBy ? `Replaced by ${version.replacedBy}` : "Earlier version"}</p>
                </div>
                <button type="button" onClick={() => onRestore(version)} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
                  <RotateCcw className="h-3.5 w-3.5" /> Restore
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const SiteContent = () => {
  const [content, setContent] = useState(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [publishedAt, setPublishedAt] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | saving | saved | error
  const [pageId, setPageId] = useState("home");
  const [openSections, setOpenSections] = useState(["home.hero"]);
  const [device, setDevice] = useState("desktop");
  const [connected, setConnected] = useState(null);
  const [problems, setProblems] = useState([]);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [versions, setVersions] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const frameRef = useRef(null);
  const contentRef = useRef(null);
  const revisionRef = useRef(0);
  const dirtyRef = useRef(false);
  const savingRef = useRef(null);
  const timerRef = useRef(null);
  const sectionRefs = useRef({});

  const page = PAGES.find((item) => item.id === pageId);

  const applyLoaded = useCallback((data) => {
    contentRef.current = data.content;
    revisionRef.current = data.revision;
    dirtyRef.current = false;
    setContent(data.content);
  }, []);

  const loadEditor = useCallback(async () => {
    setLoadError(false);
    try {
      const { data } = await API.get("/admin/site-content/editor");
      applyLoaded(data.data);
      setHasDraft(data.data.hasDraft);
      setPublishedAt(data.data.publishedAt);
    } catch (err) {
      setLoadError(true);
      toast.error(err.response?.data?.message || "Couldn't load website content");
    }
  }, [applyLoaded]);

  useEffect(() => {
    loadEditor();
  }, [loadEditor]);

  // One save at a time, always sending the latest text. Returns false if it couldn't be saved.
  const saveNow = useCallback(async () => {
    clearTimeout(timerRef.current);
    if (savingRef.current) await savingRef.current;
    if (!dirtyRef.current) return true;
    dirtyRef.current = false;
    setSaveStatus("saving");
    const request = API.put("/admin/site-content/draft", { content: contentRef.current, revision: revisionRef.current })
      .then(({ data }) => {
        revisionRef.current = data.revision;
        setHasDraft(true);
        setSaveStatus(dirtyRef.current ? "saving" : "saved");
        return true;
      })
      .catch((err) => {
        dirtyRef.current = true;
        setSaveStatus("error");
        toast.error(err.response?.data?.message || "Couldn't save your changes", { id: "site-draft-save" });
        return false;
      })
      .finally(() => {
        savingRef.current = null;
      });
    savingRef.current = request;
    return request;
  }, []);

  const update = useCallback((recipe) => {
    const next = recipe(contentRef.current);
    contentRef.current = next;
    dirtyRef.current = true;
    setContent(next);
    setProblems([]);
    setSaveStatus("saving");
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(saveNow, AUTOSAVE_MS);
  }, [saveNow]);

  // Unsaved edits: save when leaving this screen, and warn before closing the tab.
  useEffect(() => {
    const warn = (event) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => {
      window.removeEventListener("beforeunload", warn);
      saveNow();
    };
  }, [saveNow]);

  const postToPreview = useCallback((message) => {
    frameRef.current?.contentWindow?.postMessage({ source: "sb-editor", ...message }, SITE_ORIGIN);
  }, []);

  const showPage = useCallback((id, sections) => {
    setPageId(id);
    const target = PAGES.find((item) => item.id === id);
    setOpenSections(sections || (target.sections ? [`${target.root}.${target.sections[0]}`] : []));
    setConnected(null);
  }, []);

  useEffect(() => {
    if (content && connected) postToPreview({ type: "content", content });
  }, [content, connected, postToPreview]);

  useEffect(() => {
    if (!page.route || connected !== null) return undefined;
    const timer = setTimeout(() => setConnected(false), 10000);
    return () => clearTimeout(timer);
  }, [page.route, connected, pageId, device]);

  useEffect(() => {
    const onMessage = (event) => {
      if (event.origin !== SITE_ORIGIN || event.source !== frameRef.current?.contentWindow) return;
      const { source, type, keys } = event.data || {};
      if (source !== "sb-preview") return;
      if (type === "ready") {
        setConnected(true);
        postToPreview({ type: "content", content: contentRef.current });
      } else if (type === "select" && Array.isArray(keys) && keys.length) {
        const target = pageForKey(keys[0]);
        if (!target) return;
        if (target.id !== pageId) showPage(target.id, keys);
        else setOpenSections(keys);
        requestAnimationFrame(() => sectionRefs.current[keys[0]]?.scrollIntoView({ behavior: "smooth", block: "start" }));
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [pageId, postToPreview, showPage]);

  const toggleSection = (key) => {
    const opening = !openSections.includes(key);
    setOpenSections(opening ? [key] : []);
    if (opening) postToPreview({ type: "focus", key });
  };

  const askPublish = async () => {
    if (!(await saveNow())) return;
    setConfirm({
      title: "Publish your changes?",
      message: "Visitors will see them straight away. The current version is kept in the history, so you can restore it.",
      label: "Publish",
      onConfirm: async () => {
        setBusy(true);
        try {
          const { data } = await API.post("/admin/site-content/publish", { revision: revisionRef.current });
          revisionRef.current = data.revision;
          setHasDraft(false);
          setSaveStatus("idle");
          setPublishedAt(new Date().toISOString());
          setProblems([]);
          toast.success("Published. Your website is updated.");
        } catch (err) {
          setProblems(err.response?.data?.problems || []);
          toast.error(err.response?.data?.message || "Couldn't publish");
        } finally {
          setBusy(false);
          setConfirm(null);
        }
      },
    });
  };

  const askDiscard = () =>
    setConfirm({
      title: "Discard your changes?",
      message: "All unpublished edits will be lost, and the editor goes back to what's live now.",
      label: "Discard",
      onConfirm: async () => {
        setBusy(true);
        clearTimeout(timerRef.current);
        dirtyRef.current = false;
        if (savingRef.current) await savingRef.current;
        try {
          const { data } = await API.delete("/admin/site-content/draft");
          applyLoaded(data);
          setHasDraft(false);
          setSaveStatus("idle");
          setProblems([]);
          toast.success("Changes discarded");
        } catch (err) {
          toast.error(err.response?.data?.message || "Couldn't discard");
        } finally {
          setBusy(false);
          setConfirm(null);
        }
      },
    });

  const openHistory = async () => {
    setHistoryOpen(true);
    setVersions(null);
    try {
      const { data } = await API.get("/admin/site-content/versions");
      setVersions(data.data || []);
    } catch (err) {
      setVersions([]);
      toast.error(err.response?.data?.message || "Couldn't load history");
    }
  };

  const askRestore = (version) =>
    setConfirm({
      title: "Restore this version?",
      message: `It replaces your current draft with the website from ${when(version.createdAt)}. The live site doesn't change until you publish.`,
      label: "Restore",
      onConfirm: async () => {
        setBusy(true);
        clearTimeout(timerRef.current);
        dirtyRef.current = false;
        if (savingRef.current) await savingRef.current;
        try {
          const { data } = await API.post(`/admin/site-content/versions/${version._id}/restore`);
          applyLoaded(data);
          setHasDraft(true);
          setSaveStatus("saved");
          setHistoryOpen(false);
          toast.success("Restored as a draft. Review it, then publish.");
        } catch (err) {
          toast.error(err.response?.data?.message || "Couldn't restore");
        } finally {
          setBusy(false);
          setConfirm(null);
        }
      },
    });

  if (loadError) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-3 text-sm text-gray-600">
        Couldn't load website content.
        <button type="button" onClick={loadEditor} className="rounded-lg bg-primary-600 px-4 py-2 font-medium text-white hover:bg-primary-700">Try again</button>
      </div>
    );
  }
  if (!content) {
    return <div className="flex h-72 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;
  }

  const setSection = (name) => (value) =>
    update((prev) => ({ ...prev, [page.root]: { ...prev[page.root], [name]: value } }));

  const renderSection = (name) => {
    const key = `${page.root}.${name}`;
    const value = content[page.root]?.[name];
    if (value === undefined) return null;
    const open = openSections.includes(key);
    return (
      <div key={key} ref={(el) => { sectionRefs.current[key] = el; }} className="scroll-mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <button type="button" aria-expanded={open} onClick={() => toggleSection(key)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50">
          <span className="text-sm font-semibold text-gray-900">{formatLabel(name)}</span>
          {open ? <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" /> : <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />}
        </button>
        {open && (
          <div className="border-t border-gray-100 p-3">
            {Array.isArray(value) ? (
              <ObjectEditor value={{ [name]: value }} onChange={(next) => setSection(name)(next[name])} />
            ) : (
              <ObjectEditor value={value} onChange={setSection(name)} hidden={HIDDEN_FIELDS[key]} />
            )}
          </div>
        )}
      </div>
    );
  };

  const seo = content.seo || {};

  return (
    <div className="flex flex-col gap-3 lg:h-[calc(100vh-9.5rem)]">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Website pages">
          {PAGES.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={item.id === pageId}
              onClick={() => showPage(item.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${item.id === pageId ? "bg-primary-600 text-white" : "text-gray-700 hover:bg-gray-100"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-500" role="status">
            {saveStatus === "saving" && <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving draft…</>}
            {saveStatus === "saved" && <><CheckCircle className="h-3.5 w-3.5 text-green-600" /> Draft saved</>}
            {saveStatus === "error" && (
              <button type="button" onClick={saveNow} className="inline-flex items-center gap-1 font-medium text-red-600 hover:underline">
                <AlertTriangle className="h-3.5 w-3.5" /> Not saved. Retry
              </button>
            )}
            {saveStatus === "idle" && (hasDraft ? "Unpublished changes" : `Live${publishedAt ? ` · updated ${when(publishedAt)}` : ""}`)}
          </span>
          <button type="button" onClick={openHistory} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">
            <History className="h-3.5 w-3.5" /> History
          </button>
          {hasDraft && (
            <button type="button" onClick={askDiscard} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              <Trash2 className="h-3.5 w-3.5" /> Discard
            </button>
          )}
          <button
            type="button"
            onClick={askPublish}
            disabled={busy || (!hasDraft && !dirtyRef.current)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
          >
            <Upload className="h-4 w-4" /> Publish
          </button>
        </div>
      </div>

      {problems.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800" role="alert">
          <p className="font-semibold">Fix these before publishing:</p>
          <ul className="mt-1 list-inside list-disc">{problems.map((problem) => <li key={problem}>{problem}</li>)}</ul>
        </div>
      )}

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(340px,420px)_1fr]">
        <div className="min-h-0 space-y-2 overflow-y-auto rounded-xl bg-gray-50 lg:pr-1">
          {page.id === "contact" && (
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <p className="mb-3 text-sm font-semibold text-gray-900">Contact details</p>
              <ObjectEditor value={content.support} onChange={(value) => update((prev) => ({ ...prev, support: value }))} hidden={page.sections} />
            </div>
          )}

          {page.sections && page.sections.map(renderSection)}

          {page.field && (
            <label className="block rounded-xl border border-gray-200 bg-white p-3">
              <span className="mb-2 block text-sm font-semibold text-gray-900">{page.label} text</span>
              <span className="mb-2 block text-xs text-gray-500">Leave a blank line between paragraphs.</span>
              <textarea
                rows={22}
                value={content.legal?.[page.field] ?? ""}
                onChange={(event) => update((prev) => ({ ...prev, legal: { ...prev.legal, [page.field]: event.target.value } }))}
                className="admin-input resize-y"
              />
            </label>
          )}

          {page.id === "seo" && (
            <ObjectEditor value={seo} onChange={(value) => update((prev) => ({ ...prev, seo: value }))} seoMode />
          )}
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
          {page.route ? (
            <>
              <div className="flex items-center justify-between gap-2 border-b border-gray-200 px-3 py-2">
                <p className="truncate text-xs text-gray-500">Preview of your draft. Click a section to edit it.</p>
                <div className="flex shrink-0 items-center gap-1">
                  <button type="button" onClick={() => setDevice("desktop")} aria-pressed={device === "desktop"} aria-label="Desktop view" title="Desktop view" className={`rounded-lg p-1.5 ${device === "desktop" ? "bg-primary-50 text-primary-700" : "text-gray-500 hover:bg-gray-100"}`}><Monitor className="h-4 w-4" /></button>
                  <button type="button" onClick={() => setDevice("phone")} aria-pressed={device === "phone"} aria-label="Phone view" title="Phone view" className={`rounded-lg p-1.5 ${device === "phone" ? "bg-primary-50 text-primary-700" : "text-gray-500 hover:bg-gray-100"}`}><Smartphone className="h-4 w-4" /></button>
                  <a href={`${SITE_URL}${page.route}`} target="_blank" rel="noopener noreferrer" aria-label="Open the live page" title="Open the live page" className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"><ExternalLink className="h-4 w-4" /></a>
                </div>
              </div>
              <div className="min-h-0 flex-1">
                <LivePreview frameRef={frameRef} route={page.route} device={device} frameKey={page.route} connected={connected} />
              </div>
            </>
          ) : (
            <div className="space-y-3 overflow-y-auto bg-gray-50 p-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">How your pages can look on Google</h2>
                <p className="mt-0.5 text-xs text-gray-500">An estimate. Google decides what it finally shows.</p>
              </div>
              {SEARCH_PAGES.map((key) => (
                <div key={key}>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">{key === "default" ? "Other pages" : formatLabel(key)}</p>
                  <SearchPreview title={seo.pages?.[key]?.title || seo.defaultTitle} description={seo.pages?.[key]?.description || seo.defaultDescription} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {historyOpen && <HistoryPanel versions={versions} onRestore={askRestore} onClose={() => setHistoryOpen(false)} />}
      <ConfirmModal confirm={confirm} busy={busy} onCancel={() => setConfirm(null)} />
    </div>
  );
};

export default SiteContent;
