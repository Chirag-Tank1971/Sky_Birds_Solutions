import { useState } from "react";
import toast from "react-hot-toast";
import {
  AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Clock, Eye, History, Layers, Loader2, Lock, Pencil, Play, Plus, Radio, Trash2, Upload, X,
} from "lucide-react";
import API from "../api/axios";
import BulkUploadPanel from "./BulkUploadPanel";

const AUDIT_LABELS = {
  module_published: "Published module",
  module_unpublished: "Unpublished module",
  module_deleted: "Deleted module",
  lesson_published: "Published lesson",
  lesson_unpublished: "Unpublished lesson",
  lesson_moved: "Moved lesson",
  lesson_deleted: "Deleted lesson",
  course_live: "Made course live",
  course_upcoming: "Made course upcoming",
  course_private: "Made course private",
  course_unlive: "Made course unlive",
};

const durationSeconds = (text) => {
  const match = /^(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?$/.exec(String(text || "").trim());
  return match ? Number(match[1] || 0) * 3600 + Number(match[2] || 0) * 60 + Number(match[3] || 0) : 0;
};

const totalDuration = (lessons) => {
  const minutes = Math.round(lessons.reduce((sum, lesson) => sum + durationSeconds(lesson.duration), 0) / 60);
  if (!minutes) return "";
  return minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}m`;
};

export const isLocked = (modules, lesson) =>
  Boolean(lesson.upcoming || modules.find((item) => item.id === lesson.moduleId)?.upcoming);

export const ConfirmModal = ({ confirm, busy, onCancel }) => {
  if (!confirm) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" role="alertdialog" aria-modal="true" aria-label={confirm.title}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-amber-50 text-amber-600"><AlertTriangle className="h-5 w-5" /></span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">{confirm.title}</h2>
            <p className="mt-2 text-sm text-gray-500">{confirm.message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" autoFocus onClick={onCancel} disabled={busy} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
          <button type="button" onClick={confirm.onConfirm} disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirm.label}
          </button>
        </div>
      </div>
    </div>
  );
};

const PublishChecklist = ({ module, lessons, busy, onCancel, onConfirm }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={`Publish ${module.title}`}>
    <div className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl bg-white p-6 shadow-2xl">
      <h2 className="text-lg font-semibold text-gray-900">Publish {module.title}?</h2>
      <p className="mt-1 text-sm text-gray-500">
        {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}{totalDuration(lessons) ? `, ${totalDuration(lessons)}` : ""}, all ready. Buyers can watch them straight away, in this order:
      </p>
      <ol className="mt-4 flex-1 space-y-1.5 overflow-y-auto">
        {lessons.map((lesson, index) => (
          <li key={lesson.id} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm">
            <span className="w-5 shrink-0 text-xs font-bold text-gray-400">{index + 1}</span>
            <span className="min-w-0 flex-1 truncate text-gray-900">{lesson.title}</span>
            <span className="shrink-0 text-xs text-gray-500">{lesson.duration}</span>
            <CheckCircle className="h-4 w-4 shrink-0 text-green-500" aria-label="Ready" />
          </li>
        ))}
      </ol>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" autoFocus onClick={onCancel} disabled={busy} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
        <button type="button" onClick={onConfirm} disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Radio className="h-4 w-4" />}
          Publish module
        </button>
      </div>
    </div>
  </div>
);

const LearnerPreview = ({ groups, modules, onPlay, onClose }) => (
  <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="View as learner" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">View as learner</h2>
          <p className="text-xs text-gray-500">What a buyer sees right now. Nothing here changes the course.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close preview" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"><X className="h-5 w-5" /></button>
      </div>
      <div className="space-y-4 overflow-y-auto p-5">
        {groups.filter((group) => group.lessons.length > 0).map((group) => (
          <section key={group.id}>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              {group.title}
              {group.upcoming && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">Coming soon</span>}
            </h3>
            <ul className="mt-2 divide-y divide-gray-100 rounded-lg border border-gray-200">
              {group.lessons.map((lesson) => {
                const locked = isLocked(modules, lesson);
                return (
                  <li key={lesson.id}>
                    <button type="button" disabled={locked} onClick={() => onPlay(lesson)} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:hover:bg-transparent">
                      {locked ? <Lock className="h-4 w-4 shrink-0 text-gray-400" /> : <Play className="h-4 w-4 shrink-0 text-primary-600" />}
                      <span className={`min-w-0 flex-1 truncate ${locked ? "text-gray-500" : "text-gray-900"}`}>{lesson.title}</span>
                      <span className="shrink-0 text-xs text-gray-500">{locked ? "Upcoming" : lesson.duration}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  </div>
);

const CourseActivity = ({ courseId }) => {
  const [entries, setEntries] = useState(null);
  const [open, setOpen] = useState(false);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (!next) return;
    try {
      const { data } = await API.get(`/admin/courses/${courseId}/activity`);
      setEntries(data.data);
    } catch (err) {
      setEntries([]);
      toast.error(err.response?.data?.message || "Couldn't load activity");
    }
  };

  return (
    <div className="border-t border-gray-100 pt-4">
      <button type="button" onClick={toggle} aria-expanded={open} className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900">
        <History className="h-4 w-4" /> Publishing activity
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && (
        entries === null ? (
          <Loader2 className="mt-3 h-4 w-4 animate-spin text-gray-400" />
        ) : entries.length === 0 ? (
          <p className="mt-3 text-xs text-gray-500">Nothing yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {entries.map((entry) => (
              <li key={entry._id} className="text-xs text-gray-600">
                <span className="font-medium text-gray-900">{AUDIT_LABELS[entry.action] || entry.action}</span>
                {entry.targetTitle ? `: ${entry.targetTitle}` : ""}
                <span className="block text-gray-500">{new Date(entry.createdAt).toLocaleString("en-IN")}{entry.adminEmail ? ` · ${entry.adminEmail}` : ""}</span>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
};

const CourseModules = ({ courseId, modules, lessons, statusOf, renderLesson, onCourse, onCreated, onUploaded, onBlocked, onBusyChange, onPlay }) => {
  const [busy, setBusy] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [editing, setEditing] = useState(null);
  const [bulkOpen, setBulkOpen] = useState({});
  const [publishing, setPublishing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [learnerView, setLearnerView] = useState(false);

  const lessonsOf = (moduleId) => lessons.filter((lesson) => lesson.moduleId === moduleId);
  const isReady = (lesson) => Boolean(lesson.videoId) && statusOf(lesson.videoId) === "ready";

  const ungrouped = lessons.filter((lesson) => !modules.some((item) => item.id === lesson.moduleId));
  const groups = [
    ...(ungrouped.length ? [{ id: "", title: "Course content", upcoming: false, lessons: ungrouped }] : []),
    ...modules.map((item) => ({ ...item, lessons: lessonsOf(item.id) })),
  ];

  const run = async (request, success, fallback) => {
    setBusy(true);
    try {
      const { data } = await request();
      onCourse(data.data);
      if (success) toast.success(success);
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || fallback);
      if (err.response?.data?.lessons) onBlocked(err.response.data.lessons);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const base = `/admin/courses/${courseId}/modules`;

  const addModule = async (event) => {
    event.preventDefault();
    if (!newTitle.trim()) return;
    if (await run(() => API.post(base, { title: newTitle }), "Module added. It stays hidden until you publish it.", "Couldn't add the module")) setNewTitle("");
  };

  const saveEdit = async () => {
    if (!editing.title.trim()) {
      toast.error("Module title is required");
      return;
    }
    const { id, title, description } = editing;
    if (await run(() => API.put(`${base}/${id}`, { title, description }), "Module updated", "Couldn't update the module")) setEditing(null);
  };

  const moveModule = (index, direction) => {
    const order = modules.map((item) => item.id);
    [order[index], order[index + direction]] = [order[index + direction], order[index]];
    run(() => API.put(`${base}/order`, { order }), "", "Couldn't reorder modules");
  };

  const publish = async () => {
    await run(() => API.post(`${base}/${publishing.id}/publish`), "Module published", "Couldn't publish the module");
    setPublishing(null);
  };

  const askUnpublish = (item) => setConfirm({
    title: `Unpublish ${item.title}?`,
    message: "Its lessons lock for everyone, including people who already bought the course, until you publish it again.",
    label: "Unpublish module",
    onConfirm: async () => {
      await run(() => API.post(`${base}/${item.id}/unpublish`), "Module unpublished", "Couldn't unpublish the module");
      setConfirm(null);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={addModule} className="flex min-w-0 flex-1 gap-2">
          <input
            value={newTitle}
            maxLength={200}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder="New module title"
            aria-label="New module title"
            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button type="submit" disabled={busy || !newTitle.trim()} className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
            <Plus className="h-4 w-4" /> Add module
          </button>
        </form>
        <button type="button" onClick={() => setLearnerView(true)} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          <Eye className="h-4 w-4" /> View as learner
        </button>
      </div>

      {ungrouped.length > 0 && (
        <section className="rounded-xl border border-gray-200 p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900"><Layers className="h-4 w-4 text-gray-500" /> Course content</h3>
          {modules.length > 0 && <p className="mt-0.5 text-xs text-gray-500">Lessons not in a module. Learners see these first.</p>}
          <div className="mt-3 space-y-3">{ungrouped.map((lesson, index) => renderLesson(lesson, index, ungrouped.length))}</div>
        </section>
      )}

      {modules.map((item, index) => {
        const moduleLessons = lessonsOf(item.id);
        const readyCount = moduleLessons.filter(isReady).length;
        const allReady = moduleLessons.length > 0 && readyCount === moduleLessons.length;
        return (
          <section key={item.id} className={`rounded-xl border p-4 ${item.upcoming ? "border-amber-200" : "border-green-200"}`}>
            {editing?.id === item.id ? (
              <div className="space-y-2">
                <input value={editing.title} maxLength={200} autoFocus aria-label="Module title" onChange={(event) => setEditing({ ...editing, title: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                <textarea value={editing.description} maxLength={1000} rows={2} aria-label="Module description" placeholder="Short description (optional)" onChange={(event) => setEditing({ ...editing, description: event.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500" />
                <div className="flex gap-2">
                  <button type="button" onClick={saveEdit} disabled={busy} className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-50">Save</button>
                  <button type="button" onClick={() => setEditing(null)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900">
                    <span className="break-words">{item.title}</span>
                    {item.upcoming ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800"><Clock className="h-3 w-3" /> Not published</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-800"><Radio className="h-3 w-3" /> Published</span>
                    )}
                  </h3>
                  {item.description && <p className="mt-0.5 text-xs text-gray-500">{item.description}</p>}
                  <p className="mt-1 text-xs font-medium text-gray-600">
                    {moduleLessons.length === 0 ? "No lessons yet" : `${readyCount} of ${moduleLessons.length} ready`}
                    {totalDuration(moduleLessons) ? ` · ${totalDuration(moduleLessons)}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <button type="button" onClick={() => moveModule(index, -1)} disabled={busy || index === 0} aria-label={`Move ${item.title} up`} className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-25"><ChevronUp className="h-4 w-4" /></button>
                  <button type="button" onClick={() => moveModule(index, 1)} disabled={busy || index === modules.length - 1} aria-label={`Move ${item.title} down`} className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-25"><ChevronDown className="h-4 w-4" /></button>
                  <button type="button" onClick={() => setEditing({ id: item.id, title: item.title, description: item.description || "" })} aria-label={`Rename ${item.title}`} title="Rename" className="rounded p-1.5 text-gray-500 hover:bg-gray-100"><Pencil className="h-4 w-4" /></button>
                  <button
                    type="button"
                    onClick={() => run(() => API.delete(`${base}/${item.id}`), "Module deleted", "Couldn't delete the module")}
                    disabled={busy || moduleLessons.length > 0}
                    aria-label={`Delete ${item.title}`}
                    title={moduleLessons.length ? "Move or delete its lessons first" : "Delete module"}
                    className="rounded p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-25"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => setBulkOpen({ ...bulkOpen, [item.id]: true })} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100">
                    <Upload className="h-3.5 w-3.5" /> Bulk upload
                  </button>
                  {item.upcoming ? (
                    <button
                      type="button"
                      onClick={() => setPublishing(item)}
                      disabled={busy || !allReady}
                      title={allReady ? "Review and publish" : "Every lesson must be ready first"}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      <Radio className="h-3.5 w-3.5" /> Publish
                    </button>
                  ) : (
                    <button type="button" onClick={() => askUnpublish(item)} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-50">
                      <Lock className="h-3.5 w-3.5" /> Unpublish
                    </button>
                  )}
                </div>
              </div>
            )}

            {bulkOpen[item.id] && (
              <div className="mt-3">
                <BulkUploadPanel
                  courseId={courseId}
                  module={item}
                  onCourse={onCourse}
                  onCreated={onCreated}
                  onUploaded={onUploaded}
                  onBusyChange={onBusyChange}
                  onClose={() => setBulkOpen({ ...bulkOpen, [item.id]: false })}
                />
              </div>
            )}
            {moduleLessons.length > 0 && <div className="mt-3 space-y-3">{moduleLessons.map((lesson, lessonIndex) => renderLesson(lesson, lessonIndex, moduleLessons.length))}</div>}
          </section>
        );
      })}

      <CourseActivity courseId={courseId} />

      {publishing && <PublishChecklist module={publishing} lessons={lessonsOf(publishing.id)} busy={busy} onCancel={() => setPublishing(null)} onConfirm={publish} />}
      <ConfirmModal confirm={confirm} busy={busy} onCancel={() => setConfirm(null)} />
      {learnerView && <LearnerPreview groups={groups} modules={modules} onPlay={onPlay} onClose={() => setLearnerView(false)} />}
    </div>
  );
};

export default CourseModules;
