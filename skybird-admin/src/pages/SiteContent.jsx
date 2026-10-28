import { useEffect, useState } from "react";
import API from "../api/axios";
import toast from "react-hot-toast";
import {
  Save,
  Home,
  Info,
  Search,
  Headphones,
  FileText,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Type,
  Hash,
  ToggleLeft,
  List,
  Braces,
} from "lucide-react";

const empty = {
  home: {},
  about: {},
  seo: {},
  support: {},
  legal: {},
};

/* -------------------------------------------------------
   Helpers
------------------------------------------------------- */

function formatLabel(key) {
  if (!key) return "";

  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

/* -------------------------------------------------------
   Main Component
------------------------------------------------------- */

const SiteContent = () => {
  const [data, setData] = useState(empty);

  const [support, setSupport] = useState({});
  const [legal, setLegal] = useState({
    privacy: "",
    terms: "",
  });

  const [tab, setTab] = useState("home");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const { data: res } = await API.get("/admin/site-content");

      if (res.success) {
        const next = res.data || empty;

        setData(next);
        setSupport(next.support || {});
        setLegal(
          next.legal || {
            privacy: "",
            terms: "",
          },
        );
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to load website content",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* -------------------------------------------------------
     Save Home / About / SEO
  ------------------------------------------------------- */

  const saveSection = async (key, value) => {
    setSaving(true);

    try {
      const { data: res } = await API.put("/admin/site-content", {
        [key]: value,
      });

      if (res.success) {
        setData(res.data);

        toast.success(`${formatLabel(key)} content saved`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to save ${key}`);
    } finally {
      setSaving(false);
    }
  };

  /* -------------------------------------------------------
     Save Support
  ------------------------------------------------------- */

  const saveSupport = async (e) => {
    e.preventDefault();

    setSaving(true);

    try {
      const { data: res } = await API.put("/admin/site-content", {
        support,
      });

      if (res.success) {
        setData(res.data);
        toast.success("Support settings saved");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to save support settings",
      );
    } finally {
      setSaving(false);
    }
  };

  /* -------------------------------------------------------
     Save Legal
  ------------------------------------------------------- */

  const saveLegal = async (e) => {
    e.preventDefault();

    setSaving(true);

    try {
      const { data: res } = await API.put("/admin/site-content", {
        legal,
      });

      if (res.success) {
        setData(res.data);
        toast.success("Legal pages saved");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save legal pages");
    } finally {
      setSaving(false);
    }
  };

  /* -------------------------------------------------------
     Loading
  ------------------------------------------------------- */

  if (loading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary-100 border-t-primary-600" />

          <p className="mt-4 text-sm text-gray-500">
            Loading website settings...
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      value: "home",
      label: "Home Page",
      icon: Home,
      description: "Manage homepage content",
    },
    {
      value: "about",
      label: "About Page",
      icon: Info,
      description: "Manage about page",
    },
    {
      value: "seo",
      label: "SEO Settings",
      icon: Search,
      description: "Manage search metadata",
    },
    {
      value: "support",
      label: "Support",
      icon: Headphones,
      description: "Contact information",
    },
    {
      value: "legal",
      label: "Privacy & Terms",
      icon: FileText,
      description: "Legal page content",
    },
  ];

  return (
    <div className="min-h-full bg-gray-50/70">
      {/* ---------------------------------------------------
          Header
      --------------------------------------------------- */}

      <div className="mb-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
              <Braces size={13} />
              Website Manager
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Website Content
            </h1>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
              Manage your website content, SEO, support information and legal
              pages from one place.
            </p>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------
          Tabs
      --------------------------------------------------- */}

      <div className="mb-7 overflow-x-auto">
        <div className="flex min-w-max gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm">
          {tabs.map((item) => {
            const Icon = item.icon;
            const active = tab === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setTab(item.value)}
                className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                  active
                    ? "bg-primary-600 text-white shadow-md shadow-primary-600/20"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span
                  className={`grid h-9 w-9 place-items-center rounded-lg ${
                    active
                      ? "bg-white/15"
                      : "bg-gray-100 text-gray-500 group-hover:bg-white"
                  }`}
                >
                  <Icon size={17} />
                </span>

                <span>
                  <span className="block text-sm font-semibold">
                    {item.label}
                  </span>

                  <span
                    className={`mt-0.5 block text-[11px] ${
                      active ? "text-white/70" : "text-gray-400"
                    }`}
                  >
                    {item.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------------------------------------------
          Home
      --------------------------------------------------- */}

      {tab === "home" && (
        <VisualEditor
          title="Home Page"
          description="Update homepage text, sections, buttons, statistics and other content."
          value={data.home || {}}
          onSave={(value) => saveSection("home", value)}
          saving={saving}
        />
      )}

      {/* ---------------------------------------------------
          About
      --------------------------------------------------- */}

      {tab === "about" && (
        <VisualEditor
          title="About Page"
          description="Manage your company information, vision, mission, services and statistics."
          value={data.about || {}}
          onSave={(value) => saveSection("about", value)}
          saving={saving}
        />
      )}

      {/* ---------------------------------------------------
          SEO
      --------------------------------------------------- */}

      {tab === "seo" && (
        <VisualEditor
          title="SEO Settings"
          description="Manage page titles, descriptions, keywords and page-specific metadata."
          value={data.seo || {}}
          onSave={(value) => saveSection("seo", value)}
          saving={saving}
          seoMode
        />
      )}

      {/* ---------------------------------------------------
          Support
      --------------------------------------------------- */}

      {tab === "support" && (
        <form onSubmit={saveSupport} className="max-w-4xl">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-primary-600">
                  <Headphones size={20} />
                </div>

                <div>
                  <h2 className="font-semibold text-gray-900">
                    Support Information
                  </h2>

                  <p className="mt-0.5 text-xs text-gray-500">
                    These details can be displayed across your website.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-6 sm:grid-cols-2">
              <Field
                label="Support Email"
                value={support.email || ""}
                placeholder="support@example.com"
                onChange={(value) =>
                  setSupport({
                    ...support,
                    email: value,
                  })
                }
              />

              <Field
                label="Support Mobile / WhatsApp"
                value={support.mobile || ""}
                placeholder="+91 XXXXX XXXXX"
                onChange={(value) =>
                  setSupport({
                    ...support,
                    mobile: value,
                  })
                }
              />

              <div className="sm:col-span-2">
                <Field
                  label="Location"
                  value={support.location || ""}
                  placeholder="Jaipur, Rajasthan, India"
                  onChange={(value) =>
                    setSupport({
                      ...support,
                      location: value,
                    })
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <Field
                  label="Contact Page Heading"
                  value={support.heading || ""}
                  placeholder="How can we help you?"
                  onChange={(value) =>
                    setSupport({
                      ...support,
                      heading: value,
                    })
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <TextField
                  label="Contact Page Content"
                  value={support.description || ""}
                  placeholder="Write your contact/support description..."
                  onChange={(value) =>
                    setSupport({
                      ...support,
                      description: value,
                    })
                  }
                />
              </div>

              <div className="sm:col-span-2 rounded-xl border border-gray-200 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Footer Social Links</h3>
                    <p className="mt-1 text-xs text-gray-500">Add, edit, or remove the social links shown in the website footer.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSupport({ ...support, socialLinks: [...(support.socialLinks || []), { name: "", platform: "link", url: "" }] })}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700"
                  >
                    <Plus size={14} /> Add Link
                  </button>
                </div>
                <div className="space-y-3">
                  {(support.socialLinks || []).map((item, index) => (
                    <div key={`social-${index}`} className="grid gap-3 rounded-lg bg-gray-50 p-3 sm:grid-cols-[1fr_1fr_2fr_auto]">
                      <Field
                        label="Display Name"
                        value={item.name || ""}
                        placeholder="Instagram"
                        onChange={(value) => setSupport({ ...support, socialLinks: support.socialLinks.map((link, i) => i === index ? { ...link, name: value } : link) })}
                      />
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-gray-600">Icon</label>
                        <select
                          value={item.platform || "link"}
                          onChange={(event) => setSupport({ ...support, socialLinks: support.socialLinks.map((link, i) => i === index ? { ...link, platform: event.target.value } : link) })}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary-500"
                        >
                          <option value="instagram">Instagram</option>
                          <option value="facebook">Facebook</option>
                          <option value="whatsapp">WhatsApp</option>
                          <option value="telegram">Telegram</option> 
                          <option value="link">Other link</option>
                        </select>
                      </div>
                      <Field
                        label="URL"
                        value={item.url || ""}
                        placeholder="https://..."
                        onChange={(value) => setSupport({ ...support, socialLinks: support.socialLinks.map((link, i) => i === index ? { ...link, url: value } : link) })}
                      />
                      <div className="flex items-end">
                        <button type="button" onClick={() => setSupport({ ...support, socialLinks: support.socialLinks.filter((_, i) => i !== index) })} aria-label="Remove social link" className="rounded-lg p-2.5 text-red-600 hover:bg-red-50">
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {!(support.socialLinks || []).length && <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-500">No custom social links added yet.</p>}
                </div>
              </div>

              <Field
                label="Response Time"
                value={support.responseTime || ""}
                placeholder="Usually within 24 hours"
                onChange={(value) =>
                  setSupport({
                    ...support,
                    responseTime: value,
                  })
                }
              />
            </div>

            <div className="flex justify-end border-t border-gray-100 bg-gray-50/50 px-6 py-4">
              <SaveButton saving={saving} />
            </div>
          </div>
        </form>
      )}

      {/* ---------------------------------------------------
          Legal
      --------------------------------------------------- */}

      {tab === "legal" && (
        <form onSubmit={saveLegal} className="space-y-5">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-primary-600">
                  <FileText size={20} />
                </div>

                <div>
                  <h2 className="font-semibold text-gray-900">
                    Privacy Policy
                  </h2>

                  <p className="text-xs text-gray-500">
                    Content displayed on your Privacy Policy page.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <TextField
                rows={14}
                value={legal.privacy || ""}
                placeholder="Write your privacy policy..."
                onChange={(value) =>
                  setLegal({
                    ...legal,
                    privacy: value,
                  })
                }
              />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-primary-600">
                  <FileText size={20} />
                </div>

                <div>
                  <h2 className="font-semibold text-gray-900">
                    Terms & Conditions
                  </h2>

                  <p className="text-xs text-gray-500">
                    Content displayed on your Terms & Conditions page.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <TextField
                rows={14}
                value={legal.terms || ""}
                placeholder="Write your terms and conditions..."
                onChange={(value) =>
                  setLegal({
                    ...legal,
                    terms: value,
                  })
                }
              />
            </div>
          </div>

          <div className="flex justify-end">
            <SaveButton saving={saving} />
          </div>
        </form>
      )}
    </div>
  );
};

/* =========================================================
   VISUAL JSON EDITOR
========================================================= */

function VisualEditor({
  title,
  description,
  value,
  onSave,
  saving,
  seoMode = false,
}) {
  const [localValue, setLocalValue] = useState(clone(value || {}));

  useEffect(() => {
    setLocalValue(clone(value || {}));
  }, [value]);

  const updateValue = (next) => {
    setLocalValue(next);
  };

  return (
    <div className="max-w-6xl">
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {/* Header */}
        <div className="border-b border-gray-100 bg-gradient-to-r from-white to-gray-50 px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{title}</h2>

              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {description}
              </p>
            </div>

            <div className="hidden rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-500 sm:block">
              Visual Editor
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {Object.keys(localValue || {}).length === 0 ? (
            <EmptyState />
          ) : (
            <ObjectEditor
              value={localValue}
              onChange={updateValue}
              seoMode={seoMode}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-400">
            Changes are saved to the existing website content API.
          </p>

          <SaveButton saving={saving} onClick={() => onSave(localValue)} />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   OBJECT EDITOR
========================================================= */

function ObjectEditor({ value, onChange, level = 0, seoMode = false }) {
  const entries = Object.entries(value || {});

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
      <FieldCard icon={Hash} label={formatLabel(fieldKey)}>
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

  const longText =
    typeof value === "string" &&
    (value.length > 120 ||
      fieldKey.toLowerCase().includes("description") ||
      fieldKey.toLowerCase().includes("content") ||
      fieldKey.toLowerCase().includes("text"));

  return (
    <FieldCard icon={Type} label={formatLabel(fieldKey)} seoMode={seoMode}>
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
    let newItem = "";

    if (value.length > 0) {
      const first = value[0];

      if (isObject(first)) {
        newItem = clone(first);
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

function FieldCard({ icon: Icon, label, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-gray-300 hover:shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-gray-100 text-gray-500">
          <Icon size={16} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800">
            {label}
          </label>

          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-gray-400">
            Content
          </p>
        </div>
      </div>

      {children}
    </div>
  );
}

/* =========================================================
   NORMAL FIELD
========================================================= */

function Field({ label, value, onChange, placeholder = "" }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        {label}
      </label>

      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="admin-input"
      />
    </div>
  );
}

/* =========================================================
   TEXT FIELD
========================================================= */

function TextField({ label, value, onChange, rows = 5, placeholder = "" }) {
  return (
    <div>
      {label && (
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}

      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="admin-input resize-y"
      />
    </div>
  );
}

/* =========================================================
   SAVE BUTTON
========================================================= */

function SaveButton({ saving, onClick }) {
  return (
    <button
      type={onClick ? "button" : "submit"}
      onClick={onClick}
      disabled={saving}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Save size={16} />

      {saving ? "Saving..." : "Save Changes"}
    </button>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white text-gray-400 shadow-sm">
        <Braces size={24} />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-gray-700">
        No content configured
      </h3>

      <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-gray-400">
        There is currently no content data available for this section.
      </p>
    </div>
  );
}

export default SiteContent;
