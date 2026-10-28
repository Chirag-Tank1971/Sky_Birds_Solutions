import { useEffect, useState } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { Pencil, Plus, Trash2, X } from 'lucide-react';

const Testimonials = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', role: '', quote: '', order: 0, isActive: true, video: null });

  const load = async () => {
    try {
      const { data } = await API.get('/admin/testimonials');
      if (data.success) setItems(data.data || []);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to load testimonials'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', role: '', quote: '', order: 0, isActive: true, video: null }); setShow(true); };
  const openEdit = (item) => { setEditing(item); setForm({ name: item.name || '', role: item.role || '', quote: item.quote || '', order: item.order || 0, isActive: item.isActive, video: null }); setShow(true); };

  const submit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) {
        await API.put(`/admin/testimonials/${editing.id}`, { name: form.name, role: form.role, quote: form.quote, order: form.order, isActive: form.isActive });
        toast.success('Testimonial updated');
      } else {
        if (!form.video) { toast.error('Please select a video'); return; }
        const body = new FormData();
        body.append('name', form.name); body.append('role', form.role); body.append('quote', form.quote); body.append('order', form.order); body.append('isActive', String(form.isActive)); body.append('video', form.video);
        await API.post('/admin/testimonials', body, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Testimonial uploaded and processed');
      }
      setShow(false); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Operation failed'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this testimonial video?')) return;
    try { await API.delete(`/admin/testimonials/${id}`); toast.success('Testimonial deleted'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-600" /></div>;

  return <div>
    <div className="mb-8 flex items-center justify-between gap-4">
      <div><h1 className="text-2xl font-bold text-gray-900">Testimonial Videos</h1><p className="mt-1 text-gray-500">Upload public testimonial videos and manage their text.</p></div>
      <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-primary-700"><Plus className="h-4 w-4" /> Add Testimonial</button>
    </div>

    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="overflow-x-auto"><table className="w-full"><thead className="border-b border-gray-200 bg-gray-50"><tr>
        {['Order','Name','Role','Quote','Status','Actions'].map((h) => <th key={h} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">{h}</th>)}
      </tr></thead><tbody className="divide-y divide-gray-100">
        {items.map((item) => <tr key={item.id} className="hover:bg-gray-50"><td className="px-6 py-4 text-sm">{item.order}</td><td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td><td className="px-6 py-4 text-sm text-gray-500">{item.role}</td><td className="max-w-md px-6 py-4 text-sm text-gray-500">{item.quote}</td><td className="px-6 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.isActive ? 'Active' : 'Hidden'}</span></td><td className="px-6 py-4"><div className="flex gap-2"><button onClick={() => openEdit(item)} className="rounded-lg p-1.5 text-gray-500 hover:bg-primary-50 hover:text-primary-600"><Pencil className="h-4 w-4" /></button><button onClick={() => remove(item.id)} className="rounded-lg p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></div></td></tr>)}
        {!items.length && <tr><td colSpan="6" className="px-6 py-12 text-center text-gray-400">No testimonial videos uploaded yet.</td></tr>}
      </tbody></table></div>
    </div>

    {show && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"><form onSubmit={submit} className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-lg font-semibold">{editing ? 'Edit Testimonial' : 'Add Testimonial'}</h2><p className="text-sm text-gray-500">{editing ? 'Update testimonial text and visibility.' : 'The video is converted to HLS after upload.'}</p></div><button type="button" onClick={() => setShow(false)}><X /></button></div>
      <div className="space-y-4">
        <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <Field label="Role" value={form.role} onChange={(v) => setForm({ ...form, role: v })} />
        <div><label className="mb-1 block text-sm font-medium text-gray-700">Testimonial Text</label><textarea rows="4" value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-primary-500" /></div>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Order" type="number" value={form.order} onChange={(v) => setForm({ ...form, order: v })} /><label className="flex items-center gap-2 pt-7 text-sm font-medium text-gray-700"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label></div>
        {!editing && <div><label className="mb-1 block text-sm font-medium text-gray-700">Video</label><input required type="file" accept="video/*" onChange={(e) => setForm({ ...form, video: e.target.files?.[0] || null })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></div>}
      </div>
      <div className="mt-6 flex gap-3"><button type="button" onClick={() => setShow(false)} className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium">Cancel</button><button disabled={saving} className="flex-1 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60">{saving ? 'Saving...' : editing ? 'Update' : 'Upload & Save'}</button></div>
    </form></div>}
  </div>;
};

function Field({ label, value, onChange, required, type = 'text' }) { return <div><label className="mb-1 block text-sm font-medium text-gray-700">{label}</label><input required={required} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-primary-500" /></div>; }
export default Testimonials;
