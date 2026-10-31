import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CalendarDays, ClipboardList, ExternalLink, Loader2, Pencil, Plus, Trash2, Trophy, Upload, Users, X } from "lucide-react";
import API from "../api/axios";
import { ConfirmModal } from "../components/CourseModules";
import CommunityLogo from "../components/CommunityLogo";

const TABS = [
  { type: "session", label: "Live Sessions", shows: "My Sessions", noun: "session", icon: CalendarDays, linkLabel: "Join link (Zoom, Meet...)", placeholder: "https://meet.google.com/..." },
  { type: "resource", label: "Resources", shows: "My Resources", noun: "resource", icon: ClipboardList, linkLabel: "Link to the file or form", placeholder: "https://drive.google.com/..." },
  { type: "community", label: "Communities", shows: "Communities", noun: "community", icon: Users, linkLabel: "Invite link", placeholder: "https://t.me/..." },
  { type: "reward", label: "Rewards", shows: "Rewards", noun: "reward", icon: Trophy, linkLabel: "Link to claim it", placeholder: "https://..." },
];

const emptyForm = { title: "", description: "", url: "", thumbnail: "", course: "", isPublished: false, startsAt: "", durationMinutes: "60", recordingUrl: "" };
const inputClass = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100";

// <input type="datetime-local"> works in the admin's local time.
const toLocalInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const Field = ({ label, hint, children }) => (
  <label className="block text-sm">
    <span className="mb-1.5 block text-xs font-semibold text-gray-600">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
  </label>
);

export default function LearnerContent() {
  const [type, setType] = useState("session");
  const [items, setItems] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null); // null = closed, "new", or an item's id
  const [form, setForm] = useState(emptyForm);
  const [confirm, setConfirm] = useState(null);
  const [uploading, setUploading] = useState(false);

  const tab = TABS.find((item) => item.type === type);
  const isSession = type === "session";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/admin/learning-content", { params: { type } });
      setItems(data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't load this list");
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    API.get("/admin/courses")
      .then(({ data }) => setCourses(data.data || []))
      .catch(() => toast.error("Couldn't load courses"));
  }, []);

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const switchTab = (next) => {
    setType(next);
    setEditing(null);
  };

  const openNew = () => {
    setForm(emptyForm);
    setEditing("new");
  };

  const openEdit = (item) => {
    setForm({
      title: item.title,
      description: item.description || "",
      url: item.url || "",
      thumbnail: item.thumbnail || "",
      course: item.course?._id || "",
      isPublished: item.isPublished,
      startsAt: toLocalInput(item.startsAt),
      durationMinutes: String(item.durationMinutes ?? 60),
      recordingUrl: item.recordingUrl || "",
    });
    setEditing(item._id);
  };

  const uploadThumbnail = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const body = new FormData();
    body.append("thumbnail", file);
    setUploading(true);
    try {
      const { data } = await API.post("/admin/upload/thumbnail", body, { headers: { "Content-Type": "multipart/form-data" } });
      setField("thumbnail", data.url);
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't upload the image");
    } finally {
      setUploading(false);
    }
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        type,
        course: form.course || null,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : "",
        durationMinutes: Number(form.durationMinutes),
      };
      if (editing === "new") await API.post("/admin/learning-content", payload);
      else await API.put(`/admin/learning-content/${editing}`, payload);
      toast.success(form.isPublished ? "Saved. Students can see it now." : "Saved as a draft.");
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't save");
    } finally {
      setSaving(false);
    }
  };

  const askDelete = (item) =>
    setConfirm({
      title: `Delete ${item.title}?`,
      message: "Students will no longer see it. This can't be undone.",
      label: "Delete",
      onConfirm: async () => {
        setSaving(true);
        try {
          await API.delete(`/admin/learning-content/${item._id}`);
          toast.success("Deleted");
          load();
        } catch (err) {
          toast.error(err.response?.data?.message || "Couldn't delete");
        } finally {
          setSaving(false);
          setConfirm(null);
        }
      },
    });

  return (
    <div className="max-w-4xl pb-16">
      <h1 className="text-2xl font-bold text-gray-900">Learning Hub</h1>
      <p className="mt-1 text-sm text-gray-500">Live sessions, resources, communities and rewards for your students. Nothing appears until you publish it.</p>

      <div className="mt-6 flex flex-wrap gap-2" role="tablist">
        {TABS.map(({ type: value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={type === value}
            onClick={() => switchTab(value)}
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition ${type === value ? "bg-primary-600 text-white" : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">Shown under <span className="font-semibold">{tab.shows}</span> in the student dashboard.</p>
        {editing === null && (
          <button type="button" onClick={openNew} className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700">
            <Plus className="h-4 w-4" /> Add {tab.noun}
          </button>
        )}
      </div>

      {editing !== null && (
        <form onSubmit={save} className="mt-4 space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-gray-900">{editing === "new" ? `Add ${tab.noun}` : `Edit ${tab.noun}`}</h2>
            <button type="button" onClick={() => setEditing(null)} aria-label="Close form" className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"><X className="h-4 w-4" /></button>
          </div>
          <Field label="Title">
            <input required maxLength={200} value={form.title} onChange={(e) => setField("title", e.target.value)} className={inputClass} />
          </Field>
          <Field label="Description (optional)">
            <textarea rows={2} maxLength={2000} value={form.description} onChange={(e) => setField("description", e.target.value)} className={inputClass} />
          </Field>
          {isSession && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date and time">
                <input type="datetime-local" required value={form.startsAt} onChange={(e) => setField("startsAt", e.target.value)} className={inputClass} />
              </Field>
              <Field label="Length (minutes)" hint="The join link disappears after this.">
                <input type="number" required min="1" max="1440" value={form.durationMinutes} onChange={(e) => setField("durationMinutes", e.target.value)} className={inputClass} />
              </Field>
            </div>
          )}
          <Field label={tab.linkLabel}>
            <input type="url" required={!isSession} placeholder={tab.placeholder} value={form.url} onChange={(e) => setField("url", e.target.value)} className={inputClass} />
          </Field>
          {isSession && (
            <Field label="Recording link (optional)" hint="Shown to students once the session has ended.">
              <input type="url" placeholder="https://..." value={form.recordingUrl} onChange={(e) => setField("recordingUrl", e.target.value)} className={inputClass} />
            </Field>
          )}
          <div>
            <p className="mb-1.5 text-xs font-semibold text-gray-600">Thumbnail or logo (optional)</p>
            <div className="flex flex-wrap items-center gap-3">
              {form.thumbnail && <img src={form.thumbnail} alt="Thumbnail preview" className="h-20 w-32 rounded-lg border border-gray-200 object-cover" />}
              <label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100 focus-within:ring-2 focus-within:ring-primary-500 ${uploading ? "pointer-events-none opacity-60" : ""}`}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Uploading..." : form.thumbnail ? "Change image" : "Upload image"}
                <input type="file" accept="image/*" onChange={uploadThumbnail} disabled={uploading} className="sr-only" />
              </label>
              {form.thumbnail && <button type="button" onClick={() => setField("thumbnail", "")} className="text-sm font-medium text-red-600 hover:underline">Remove</button>}
            </div>
            {type === "community" && <p className="mt-1 text-xs text-gray-500">Telegram and WhatsApp links show their logo automatically if you don't upload one.</p>}
          </div>
          <Field label="Who can see it" hint={form.course ? "" : "Anyone with a free account can open this link, including people who haven't bought a course."}>
            <select value={form.course} onChange={(e) => setField("course", e.target.value)} className={inputClass}>
              <option value="">All logged-in students</option>
              {courses.map((course) => <option key={course._id} value={course._id}>Buyers of {course.title}</option>)}
            </select>
          </Field>
          <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm text-gray-700">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => setField("isPublished", e.target.checked)} className="h-4 w-4 accent-primary-600" />
            Published (visible to students)
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={saving || uploading} className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </button>
            <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          </div>
        </form>
      )}

      <div className="mt-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
        ) : items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">Nothing here yet. Students see a "coming soon" message for this section.</p>
        ) : (
          items.map((item) => (
            <div key={item._id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <CommunityLogo item={item} />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-gray-900">
                  <span className="break-words">{item.title}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${item.isPublished ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                    {item.isPublished ? "Published" : "Draft"}
                  </span>
                </p>
                {item.description && <p className="mt-1 text-xs text-gray-500">{item.description}</p>}
                <p className="mt-1 text-xs text-gray-600">
                  {isSession && item.startsAt ? `${new Date(item.startsAt).toLocaleString("en-IN")} · ${item.durationMinutes} min · ` : ""}
                  {item.course ? `Buyers of ${item.course.title}` : "All logged-in students"}
                </p>
                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 text-xs font-medium text-primary-700 hover:underline">
                    <ExternalLink className="h-3 w-3 shrink-0" /> <span className="truncate">{item.url}</span>
                  </a>
                )}
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={() => openEdit(item)} aria-label={`Edit ${item.title}`} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"><Pencil className="h-4 w-4" /></button>
                <button type="button" onClick={() => askDelete(item)} aria-label={`Delete ${item.title}`} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal confirm={confirm} busy={saving} onCancel={() => setConfirm(null)} />
    </div>
  );
}
