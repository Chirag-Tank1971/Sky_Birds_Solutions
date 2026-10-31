import { useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  ToggleLeft,
  List,
  Braces,
  Loader2,
  Upload,
} from "lucide-react";
import API from "../api/axios";

export const SITE_URL = (import.meta.env.VITE_SITE_URL || (import.meta.env.DEV ? "http://localhost:5173" : "https://sky-birds-solutions.vercel.app")).replace(/\/+$/, "");

const LABELS = { sectionsIntro: "Content sections heading", promisesIntro: "Promises heading", trainer: "Trainer", contactPage: "Contact page text", footer: "Footer", floatingTags: "Floating tags", telegramUrl: "Telegram link", imageUrl: "Image", secondImageUrl: "Second image", q: "Question", a: "Answer", faqs: "Questions", faq: "FAQ heading", cta: "Call to action", seo: "SEO", servicesList: "Services", contentSections: "Content sections", who: "The journey", vision: "The lesson", mission: "Why this course", stats: "Stats", promises: "Promises", mobile: "Phone number", whatsapp: "WhatsApp number" };
const LONG_FIELDS = ["a", "intro", "paragraph1", "paragraph2", "subtitle", "officeText"];

// Saved images are web addresses or paths on the user site.
function ImageField({ label, value, onChange }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const body = new FormData();
    body.append("thumbnail", file);
    setUploading(true);
    try {
      const { data } = await API.post("/admin/upload/thumbnail", body, { headers: { "Content-Type": "multipart/form-data" } });
      onChange(data.url);
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't upload the image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-gray-700">{label}</p>
      <div className="flex items-center gap-3">
        {value && <img src={value.startsWith("/") ? `${SITE_URL}${value}` : value} alt="" className="h-16 w-24 shrink-0 rounded-lg border border-gray-200 object-cover" />}
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="inline-flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100 disabled:opacity-60">
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Uploading..." : "Change image"}
        </button>
        <input ref={inputRef} type="file" accept="image/*" onChange={upload} className="hidden" aria-label={`Upload ${label}`} />
      </div>
    </div>
  );
}

export function formatLabel(key) {
  if (!key) return "";
  if (LABELS[key]) return LABELS[key];

  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function blankCopy(value) {
  if (Array.isArray(value)) return value.length && typeof value[0] === "string" ? [""] : [];
  if (isObject(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, blankCopy(item)]));
  if (typeof value === "number") return 0;
  if (typeof value === "boolean") return false;
  return "";
}

export function ObjectEditor({ value, onChange, level = 0, seoMode = false, hidden = [] }) {
  const entries = Object.entries(value || {}).filter(([key]) => !hidden.includes(key));

  return (
    <div className="space-y-4">
      {entries.map(([key, currentValue]) => (
        <VisualField
          key={key}
          fieldKey={key}
          value={currentValue}
          parent={value}
          onChange={onChange}
          level={level}
          seoMode={seoMode}
        />
      ))}
    </div>
  );
}

/* =========================================================
   VISUAL FIELD
========================================================= */

function VisualField({ fieldKey, value, parent, onChange, level, seoMode }) {
  const [open, setOpen] = useState(true);

  const update = (newValue) => {
    onChange({
      ...parent,
      [fieldKey]: newValue,
    });
  };

  /* ---------------------------------------------
     OBJECT
  --------------------------------------------- */

  if (isObject(value)) {
    return (
      <div
        className={`overflow-hidden rounded-xl border ${
          level === 0
            ? "border-gray-200 bg-white"
            : "border-gray-100 bg-gray-50/50"
        }`}
      >
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-gray-50"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-600">
              <Braces size={16} />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-800">
                {formatLabel(fieldKey)}
              </p>

              <p className="mt-0.5 text-[11px] text-gray-400">
                {Object.keys(value).length} fields
              </p>
            </div>
          </div>

          {open ? (
            <ChevronDown size={17} className="shrink-0 text-gray-400" />
          ) : (
            <ChevronRight size={17} className="shrink-0 text-gray-400" />
          )}
        </button>

        {open && (
          <div className="border-t border-gray-100 p-4 sm:p-5">
            <ObjectEditor
              value={value}
              onChange={update}
              level={level + 1}
              seoMode={seoMode}
            />
          </div>
        )}
      </div>
    );
  }

  /* ---------------------------------------------
     ARRAY
  --------------------------------------------- */

  if (Array.isArray(value)) {
    return (
      <ArrayEditor
        fieldKey={fieldKey}
        value={value}
        onChange={update}
        level={level}
      />
    );
  }

  /* ---------------------------------------------
     BOOLEAN
  --------------------------------------------- */

  if (typeof value === "boolean") {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600">
              <ToggleLeft size={17} />
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-800">
                {formatLabel(fieldKey)}
              </p>

              <p className="text-[11px] text-gray-400">
                Enable or disable this option
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => update(!value)}
            className={`relative h-6 w-11 rounded-full transition ${
              value ? "bg-primary-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
                value ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------
     NUMBER
  --------------------------------------------- */

  if (typeof value === "number") {
    return (
      <FieldCard label={formatLabel(fieldKey)}>
        <input
          type="number"
          value={value}
          onChange={(e) =>
            update(e.target.value === "" ? 0 : Number(e.target.value))
          }
          className="admin-input"
        />
      </FieldCard>
    );
  }

  /* ---------------------------------------------
     STRING
  --------------------------------------------- */

  if (/imageUrl$/i.test(fieldKey)) {
    return <ImageField label={formatLabel(fieldKey)} value={value} onChange={update} />;
  }

  const longText =
    typeof value === "string" &&
    (value.length > 120 ||
      fieldKey.toLowerCase().includes("description") ||
      fieldKey.toLowerCase().includes("content") ||
      fieldKey.toLowerCase().includes("text") ||
      LONG_FIELDS.includes(fieldKey));

  return (
    <FieldCard label={formatLabel(fieldKey)}>
      {longText ? (
        <textarea
          value={value ?? ""}
          onChange={(e) => update(e.target.value)}
          rows={4}
          className="admin-input resize-y"
        />
      ) : (
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => update(e.target.value)}
          className="admin-input"
        />
      )}
    </FieldCard>
  );
}

/* =========================================================
   ARRAY EDITOR
========================================================= */

function ArrayEditor({ fieldKey, value, onChange, level }) {
  const [open, setOpen] = useState(true);

  const addItem = () => {
    let newItem = fieldKey === "socialLinks" ? { platform: "", url: "" } : "";

    if (value.length > 0) {
      const first = value[0];

      if (isObject(first)) {
        newItem = blankCopy(first);
      } else if (typeof first === "number") {
        newItem = 0;
      } else if (typeof first === "boolean") {
        newItem = false;
      }
    }

    onChange([...value, newItem]);
  };

  const removeItem = (index) => {
    const next = value.filter((_, i) => i !== index);
    onChange(next);
  };

  const updateItem = (index, nextValue) => {
    const next = [...value];
    next[index] = nextValue;
    onChange(next);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* Array Header */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3.5">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex min-w-0 items-center gap-3 text-left"
        >
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-purple-50 text-purple-600">
            <List size={17} />
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-800">
              {formatLabel(fieldKey)}
            </p>

            <p className="text-[11px] text-gray-400">{value.length} items</p>
          </div>

          {open ? (
            <ChevronDown size={16} className="text-gray-400" />
          ) : (
            <ChevronRight size={16} className="text-gray-400" />
          )}
        </button>

        <button
          type="button"
          onClick={addItem}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-700 transition hover:bg-primary-100"
        >
          <Plus size={14} />
          Add
        </button>
      </div>

      {/* Items */}
      {open && (
        <div className="space-y-3 bg-gray-50/50 p-4">
          {value.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center">
              <p className="text-sm text-gray-400">No items added yet.</p>

              <button
                type="button"
                onClick={addItem}
                className="mt-3 text-xs font-semibold text-primary-600 hover:underline"
              >
                + Add first item
              </button>
            </div>
          ) : (
            value.map((item, index) => (
              <div
                key={index}
                className="relative rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Item {index + 1}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="grid h-8 w-8 place-items-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                    title="Remove item"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {isObject(item) ? (
                  <ObjectEditor
                    value={item}
                    onChange={(next) => updateItem(index, next)}
                    level={level + 1}
                  />
                ) : typeof item === "string" && item.length > 80 ? (
                  <textarea
                    rows={4}
                    value={item}
                    onChange={(e) => updateItem(index, e.target.value)}
                    className="admin-input resize-y"
                  />
                ) : (
                  <input
                    type={typeof item === "number" ? "number" : "text"}
                    value={item ?? ""}
                    onChange={(e) => {
                      let next = e.target.value;

                      if (typeof item === "number") {
                        next = next === "" ? 0 : Number(next);
                      }

                      updateItem(index, next);
                    }}
                    className="admin-input"
                  />
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   FIELD CARD
========================================================= */

function FieldCard({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-gray-700">{label}</span>
      {children}
    </label>
  );
}
