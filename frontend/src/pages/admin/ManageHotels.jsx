import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Modal from "../../components/Modal";
import adminApi from "../../services/adminApi";

export default function ManageHotels() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", location: "", description: "" });

  async function load() {
    setError("");
    try {
      const res = await adminApi.get("/admin/hotels");
      setItems(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load hotels");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function startCreate() {
    setEditing(null);
    setForm({ name: "", location: "", description: "" });
    setOpen(true);
  }

  function startEdit(h) {
    setEditing(h);
    setForm({ name: h.name, location: h.location, description: h.description });
    setOpen(true);
  }

  async function save() {
    setError("");
    try {
      if (editing) {
        await adminApi.put(`/admin/hotels/${editing.id}`, form);
      } else {
        await adminApi.post("/admin/hotels", form);
      }
      setOpen(false);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Save failed");
    }
  }

  async function remove(id) {
    if (!confirm("Delete this hotel? Rooms inside will also be deleted.")) return;
    setError("");
    try {
      await adminApi.delete(`/admin/hotels/${id}`);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Delete failed");
    }
  }

  return (
    <AdminLayout title="Manage Hotels">
      {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <div className="flex justify-end">
        <Button onClick={startCreate}>Add Hotel</Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-600">
              <tr>
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Location</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="text-slate-800">
              {items.map((h) => (
                <tr key={h.id} className="border-t border-slate-100">
                  <td className="py-3 pr-4 font-medium">{h.name}</td>
                  <td className="py-3 pr-4">{h.location}</td>
                  <td className="py-3 pr-4">
                    <div className="flex gap-2">
                      <Button className="bg-slate-900 hover:bg-slate-950" onClick={() => startEdit(h)}>
                        Edit
                      </Button>
                      <Button className="bg-red-600 hover:bg-red-700" onClick={() => remove(h.id)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!items.length ? (
                <tr>
                  <td colSpan={3} className="py-4 text-slate-600">
                    No hotels yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={open}
        title={editing ? "Edit Hotel" : "Add Hotel"}
        onClose={() => setOpen(false)}
      >
        <div className="space-y-3">
          <Input label="Name" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
          <Input
            label="Location"
            value={form.location}
            onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))}
          />
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
              rows={4}
              value={form.description}
              onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
            />
          </div>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={save}>
              Save
            </Button>
            <Button className="flex-1 bg-slate-900 hover:bg-slate-950" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}

