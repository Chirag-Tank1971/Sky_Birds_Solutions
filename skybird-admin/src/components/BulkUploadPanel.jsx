import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Loader2, RefreshCw, Upload, X } from "lucide-react";
import API from "../api/axios";
import { uploadToBunny } from "../api/bunnyUpload";

const MAX_FILES = 50;
const MAX_FILE_BYTES = 5 * 1024 * 1024 * 1024;
const CONCURRENT_UPLOADS = 3;
const VIDEO_FILE = /\.(mp4|m4v|mov|webm|mkv|avi)$/i;

const titleFromName = (name) => name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim().slice(0, 200);
const naturalOrder = (a, b) => a.file.name.localeCompare(b.file.name, undefined, { numeric: true, sensitivity: "base" });
const formatSize = (bytes) => (bytes >= 1024 ** 3 ? `${(bytes / 1024 ** 3).toFixed(1)} GB` : `${Math.max(1, Math.round(bytes / 1024 ** 2))} MB`);

const BulkUploadPanel = ({ courseId, module, onCourse, onCreated, onUploaded, onBusyChange, onClose }) => {
  const [rows, setRowsState] = useState([]);
  const [started, setStarted] = useState(false);
  const [creating, setCreating] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const rowsRef = useRef([]);
  const activeRef = useRef(0);
  const handlesRef = useRef({});
  const nextKeyRef = useRef(0);

  const setRows = (next) => {
    rowsRef.current = next;
    setRowsState(next);
  };
  const patchRow = (key, patch) => setRows(rowsRef.current.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  const busy = creating || rows.some((row) => row.state === "queued" || row.state === "uploading");
  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);
  useEffect(() => () => {
    Object.values(handlesRef.current).forEach((handle) => handle.cancel());
    onBusyChange?.(false);
  }, [onBusyChange]);

  const addFiles = (fileList) => {
    const files = Array.from(fileList || []);
    const valid = files.filter((file) => file.type.startsWith("video/") || VIDEO_FILE.test(file.name));
    if (valid.length < files.length) toast.error(`${files.length - valid.length} file(s) skipped: not a video`);
    const sized = valid.filter((file) => file.size > 0 && file.size <= MAX_FILE_BYTES);
    if (sized.length < valid.length) toast.error(`${valid.length - sized.length} file(s) skipped: empty or larger than 5 GB`);
    const room = MAX_FILES - rowsRef.current.length;
    if (sized.length > room) toast.error(`You can upload up to ${MAX_FILES} videos at a time`);
    const added = sized.slice(0, Math.max(room, 0)).map((file) => {
      nextKeyRef.current += 1;
      return { key: nextKeyRef.current, file, title: titleFromName(file.name), state: "review", percent: 0 };
    });
    setRows([...rowsRef.current, ...added.sort(naturalOrder)]);
  };

  const moveRow = (index, direction) => {
    const next = [...rowsRef.current];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    setRows(next);
  };

  const pump = () => {
    while (activeRef.current < CONCURRENT_UPLOADS) {
      const row = rowsRef.current.find((item) => item.state === "queued");
      if (!row) return;
      activeRef.current += 1;
      patchRow(row.key, { state: "uploading", error: "" });
      const handle = uploadToBunny(row.file, row.signed, row.title, (percent) => patchRow(row.key, { percent }));
      handlesRef.current[row.key] = handle;
      handle.promise
        .then(() => {
          patchRow(row.key, { state: "done", percent: 100 });
          onUploaded(row.signed.videoId);
        })
        .catch((err) => {
          // One failure doesn't stop the rest.
          patchRow(row.key, err.cancelled ? { state: "cancelled" } : { state: "failed", error: "Upload failed" });
        })
        .finally(() => {
          delete handlesRef.current[row.key];
          activeRef.current -= 1;
          pump();
        });
    }
  };

  const start = async () => {
    if (rowsRef.current.some((row) => !row.title.trim())) {
      toast.error("Every lesson needs a title");
      return;
    }
    setCreating(true);
    try {
      // Lessons are saved before uploading, so a refresh can't lose them.
      const { data } = await API.post(`/admin/courses/${courseId}/modules/${module.id}/lessons/bulk`, {
        lessons: rowsRef.current.map((row) => ({ title: row.title.trim(), size: row.file.size })),
      });
      onCourse(data.data);
      onCreated(data.uploads.map((upload) => upload.videoId));
      setRows(rowsRef.current.map((row, index) => ({ ...row, signed: data.uploads[index], state: "queued" })));
      setStarted(true);
      pump();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't create the lessons");
    } finally {
      setCreating(false);
    }
  };

  const retry = async (row) => {
    patchRow(row.key, { state: "queued", error: "" });
    try {
      const { data } = await API.post(`/admin/videos/bunny/${row.signed.videoId}/upload-signature`);
      patchRow(row.key, { signed: { ...row.signed, ...data } });
      pump();
    } catch (err) {
      if (err.response?.status === 409) {
        patchRow(row.key, { state: "done", percent: 100 });
        onUploaded(row.signed.videoId);
      } else {
        patchRow(row.key, { state: "failed", error: err.response?.data?.message || "Couldn't retry" });
      }
    }
  };

  const doneCount = rows.filter((row) => row.state === "done").length;
  const overall = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.percent, 0) / rows.length) : 0;
  const duplicates = new Set(
    rows.map((row) => row.file.name).filter((name, index, names) => names.indexOf(name) !== index)
  );

  return (
    <div className="space-y-4 rounded-xl border border-primary-200 bg-primary-50/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">Bulk upload to {module.title}</p>
          <p className="mt-0.5 text-xs text-gray-500">New lessons stay hidden until you publish the module.</p>
        </div>
        <button type="button" onClick={onClose} disabled={busy} aria-label="Close bulk upload" className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40">
          <X className="h-4 w-4" />
        </button>
      </div>

      {!started && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); setDragging(false); addFiles(event.dataTransfer.files); }}
          className={`flex w-full flex-col items-center gap-1 rounded-xl border-2 border-dashed px-4 py-6 text-center transition ${dragging ? "border-primary-500 bg-primary-50" : "border-gray-300 bg-white hover:border-primary-300"}`}
        >
          <Upload className="h-5 w-5 text-primary-600" />
          <span className="text-sm font-medium text-gray-800">Drop videos here, or click to choose</span>
          <span className="text-xs text-gray-500">Up to {MAX_FILES} files, 5 GB each</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="video/*"
        className="hidden"
        onChange={(event) => { addFiles(event.target.files); event.target.value = ""; }}
      />

      {started && (
        <div>
          <div className="flex justify-between text-xs font-medium text-gray-700">
            <span>{doneCount} of {rows.length} uploaded</span>
            <span>{overall}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200">
            <div className="h-full rounded-full bg-primary-600 transition-all" style={{ width: `${overall}%` }} />
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <ul className="space-y-2">
          {rows.map((row, index) => (
            <li key={row.key} className="rounded-lg border border-gray-200 bg-white p-2.5">
              <div className="flex items-center gap-2">
                <span className="w-6 shrink-0 text-center text-xs font-bold text-gray-400">{index + 1}</span>
                {started ? (
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">{row.title}</p>
                ) : (
                  <input
                    value={row.title}
                    maxLength={200}
                    aria-label={`Title for ${row.file.name}`}
                    onChange={(event) => patchRow(row.key, { title: event.target.value })}
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                  />
                )}
                {!started && (
                  <>
                    <button type="button" onClick={() => moveRow(index, -1)} disabled={index === 0} aria-label={`Move ${row.title} up`} className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-25"><ChevronUp className="h-4 w-4" /></button>
                    <button type="button" onClick={() => moveRow(index, 1)} disabled={index === rows.length - 1} aria-label={`Move ${row.title} down`} className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-25"><ChevronDown className="h-4 w-4" /></button>
                    <button type="button" onClick={() => setRows(rowsRef.current.filter((item) => item.key !== row.key))} aria-label={`Remove ${row.title}`} className="rounded p-1 text-red-500 hover:bg-red-50"><X className="h-4 w-4" /></button>
                  </>
                )}
                {row.state === "done" && <CheckCircle className="h-4 w-4 shrink-0 text-green-500" aria-label="Uploaded" />}
                {row.state === "uploading" && (
                  <button type="button" onClick={() => handlesRef.current[row.key]?.cancel()} className="shrink-0 rounded px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100">Cancel</button>
                )}
                {(row.state === "failed" || row.state === "cancelled") && (
                  <button type="button" onClick={() => retry(row)} className="inline-flex shrink-0 items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-primary-700 hover:bg-primary-50">
                    <RefreshCw className="h-3 w-3" /> Retry
                  </button>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 pl-8 text-xs text-gray-500">
                <span className="break-all">{row.file.name} · {formatSize(row.file.size)}</span>
                {!started && duplicates.has(row.file.name) && (
                  <span className="inline-flex items-center gap-1 font-medium text-amber-700"><AlertTriangle className="h-3 w-3" /> Duplicate filename</span>
                )}
                {row.state === "queued" && <span>Waiting…</span>}
                {row.state === "uploading" && <span className="inline-flex items-center gap-1 text-primary-700"><Loader2 className="h-3 w-3 animate-spin" /> {row.percent}%</span>}
                {row.state === "cancelled" && <span className="font-medium text-amber-700">Cancelled</span>}
                {row.state === "failed" && <span className="font-medium text-red-600">{row.error}</span>}
              </div>
              {row.state === "uploading" && (
                <div className="ml-8 mt-1.5 h-1 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full bg-primary-500" style={{ width: `${row.percent}%` }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {!started && rows.length > 0 && (
        <button
          type="button"
          onClick={start}
          disabled={creating}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {creating ? "Creating lessons…" : `Upload ${rows.length} ${rows.length === 1 ? "video" : "videos"}`}
        </button>
      )}
      {started && !busy && (
        <p className="text-xs text-gray-600">
          Uploads finished. Videos process in the background; you can close this and leave the page. Publish the module when all lessons are ready.
        </p>
      )}
    </div>
  );
};

export default BulkUploadPanel;
