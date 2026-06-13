import { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import Card from "../../components/Card";
import adminApi from "../../services/adminApi";

function Stat({ label, value }) {
  return (
    <Card className="border border-slate-100">
      <p className="text-sm font-semibold text-slate-700">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </Card>
  );
}

export default function AdminDashboard() {
  const [totals, setTotals] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setError("");
      try {
        const res = await adminApi.get("/admin/dashboard");
        setTotals(res.data.totals);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load admin dashboard");
      }
    }
    load();
  }, []);

  return (
    <AdminLayout title="Dashboard">
      {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total Users" value={totals?.users ?? "—"} />
        <Stat label="Total Hotels" value={totals?.hotels ?? "—"} />
        <Stat label="Total Rooms" value={totals?.rooms ?? "—"} />
        <Stat label="Total Bookings" value={totals?.bookings ?? "—"} />
      </div>
      <Card>
        <p className="text-sm font-semibold text-slate-900">Admin capabilities</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>Manage hotels and rooms</li>
          <li>View and update booking status</li>
          <li>Protected by JWT + role-based middleware</li>
        </ul>
      </Card>
    </AdminLayout>
  );
}

