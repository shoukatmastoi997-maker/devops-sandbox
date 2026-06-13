import { useEffect, useMemo, useState } from "react";
import AdminLayout from "./AdminLayout";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Select from "../../components/Select";
import Modal from "../../components/Modal";
import adminApi from "../../services/adminApi";

export default function ManageRooms() {
  const [rooms, setRooms] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    hotel_id: "",
    room_type: "Single",
    capacity: 1,
    ac_type: "Non-AC",
    price: 2000,
  });
  const [filterHotel, setFilterHotel] = useState("");

  async function load() {
    setError("");
    try {
      const [h, r] = await Promise.all([adminApi.get("/admin/hotels"), adminApi.get("/rooms")]);
      setHotels(h.data);
      setRooms(r.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load rooms");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!filterHotel) return rooms;
    return rooms.filter((r) => String(r.hotel_id) === String(filterHotel));
  }, [rooms, filterHotel]);

  function startCreate() {
    setEditing(null);
    setForm({
      hotel_id: hotels[0]?.id ?? "",
      room_type: "Single",
      capacity: 1,
      ac_type: "Non-AC",
      price: 2000,
    });
    setOpen(true);
  }

  function startEdit(r) {
    setEditing(r);
    setForm({
      hotel_id: r.hotel_id,
      room_type: r.room_type,
      capacity: r.capacity,
      ac_type: r.ac_type,
      price: r.price,
    });
    setOpen(true);
  }

  async function save() {
    setError("");
    try {
      const payload = {
        hotel_id: Number(form.hotel_id),
        room_type: form.room_type,
        capacity: Number(form.capacity),
        ac_type: form.ac_type,
        price: Number(form.price),
      };
      if (editing) {
        await adminApi.put(`/admin/rooms/${editing.id}`, payload);
      } else {
        await adminApi.post("/admin/rooms", payload);
      }
      setOpen(false);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Save failed");
    }
  }

  async function remove(id) {
    if (!confirm("Delete this room?")) return;
    setError("");
    try {
      await adminApi.delete(`/admin/rooms/${id}`);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Delete failed");
    }
  }

  return (
    <AdminLayout title="Manage Rooms">
      {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="w-full max-w-xs">
          <Select label="Filter by hotel" value={filterHotel} onChange={(e) => setFilterHotel(e.target.value)}>
            <option value="">All hotels</option>
            {hotels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </Select>
        </div>
        <Button onClick={startCreate}>Add Room</Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-600">
              <tr>
                <th className="py-2 pr-4">Hotel</th>
                <th className="py-2 pr-4">Room</th>
                <th className="py-2 pr-4">Capacity</th>
                <th className="py-2 pr-4">AC</th>
                <th className="py-2 pr-4">Price</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="text-slate-800">
              {filtered.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="py-3 pr-4">{r.hotel_name || `Hotel #${r.hotel_id}`}</td>
                  <td className="py-3 pr-4 font-medium">{r.room_type}</td>
                  <td className="py-3 pr-4">{r.capacity}</td>
                  <td className="py-3 pr-4">{r.ac_type}</td>
                  <td className="py-3 pr-4">PKR {r.price}</td>
                  <td className="py-3 pr-4">
                    <div className="flex gap-2">
                      <Button className="bg-slate-900 hover:bg-slate-950" onClick={() => startEdit(r)}>
                        Edit
                      </Button>
                      <Button className="bg-red-600 hover:bg-red-700" onClick={() => remove(r.id)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr>
                  <td colSpan={6} className="py-4 text-slate-600">
                    No rooms found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={open} title={editing ? "Edit Room" : "Add Room"} onClose={() => setOpen(false)}>
        <div className="space-y-3">
          <Select label="Hotel" value={form.hotel_id} onChange={(e) => setForm((s) => ({ ...s, hotel_id: e.target.value }))}>
            {hotels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </Select>
          <Select label="Room Type" value={form.room_type} onChange={(e) => setForm((s) => ({ ...s, room_type: e.target.value }))}>
            <option value="Single">Single</option>
            <option value="Double">Double</option>
            <option value="Triple">Triple</option>
          </Select>
          <Input
            label="Capacity"
            type="number"
            min={1}
            value={form.capacity}
            onChange={(e) => setForm((s) => ({ ...s, capacity: e.target.value }))}
          />
          <Select label="AC Type" value={form.ac_type} onChange={(e) => setForm((s) => ({ ...s, ac_type: e.target.value }))}>
            <option value="AC">AC</option>
            <option value="Non-AC">Non-AC</option>
          </Select>
          <Input
            label="Price (PKR)"
            type="number"
            min={0}
            value={form.price}
            onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))}
          />
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

