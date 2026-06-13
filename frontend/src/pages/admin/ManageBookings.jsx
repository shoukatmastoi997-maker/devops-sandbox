import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import Card from "../../components/Card";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Select from "../../components/Select";
import adminApi from "../../services/adminApi";

export default function ManageBookings() {
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ user_email: "", from: "", to: "" });
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const params = {};
      if (filters.user_email.trim()) params.user_email = filters.user_email.trim();
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
      const res = await adminApi.get("/admin/bookings", { params });
      setItems(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load bookings");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id, status) {
    setError("");
    try {
      await adminApi.put(`/admin/bookings/${id}`, { status });
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Update failed");
    }
  }

  return (
    <AdminLayout title="Manage Bookings">
      {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      <Card>
        <div className="grid gap-3 md:grid-cols-4">
          <Input
            label="User email"
            value={filters.user_email}
            onChange={(e) => setFilters((s) => ({ ...s, user_email: e.target.value }))}
            placeholder="user@example.com"
          />
          <Input label="From" type="date" value={filters.from} onChange={(e) => setFilters((s) => ({ ...s, from: e.target.value }))} />
          <Input label="To" type="date" value={filters.to} onChange={(e) => setFilters((s) => ({ ...s, to: e.target.value }))} />
          <div className="flex items-end">
            <Button className="w-full" onClick={load}>
              Apply Filters
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-600">
              <tr>
                <th className="py-2 pr-4">User</th>
                <th className="py-2 pr-4">Hotel / Room</th>
                <th className="py-2 pr-4">Dates</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Action</th>
              </tr>
            </thead>
            <tbody className="text-slate-800">
              {items.map((b) => (
                <tr key={b.id} className="border-t border-slate-100">
                  <td className="py-3 pr-4">
                    <p className="font-medium">{b.user.email}</p>
                    <p className="text-xs text-slate-500">{b.user.name}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <p className="font-medium">{b.room.hotel.name}</p>
                    <p className="text-xs text-slate-600">
                      {b.room.room_type} ({b.room.ac_type}) • PKR {b.room.price}/night
                    </p>
                  </td>
                  <td className="py-3 pr-4">
                    {b.start_date} → {b.end_date}
                  </td>
                  <td className="py-3 pr-4">PKR {b.total_price}</td>
                  <td className="py-3 pr-4">{b.status}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <Select value={b.status} onChange={(e) => updateStatus(b.id, e.target.value)}>
                        <option value="pending">pending</option>
                        <option value="confirmed">confirmed</option>
                        <option value="cancelled">cancelled</option>
                      </Select>
                    </div>
                  </td>
                </tr>
              ))}
              {!items.length ? (
                <tr>
                  <td colSpan={6} className="py-4 text-slate-600">
                    No bookings found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </AdminLayout>
  );
}

