import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import api from "../services/api";

export default function Dashboard() {
  const [bookings, setBookings] = useState([]);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setError("");
      try {
        const [b, i] = await Promise.all([api.get("/user/bookings"), api.get("/user/insights")]);
        setBookings(b.data);
        setInsights(i.data);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load dashboard");
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-slate-600">Your history and personalized suggestions.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/questionnaire">
            <Button>AI Recommend</Button>
          </Link>
          <Link to="/rooms">
            <Button className="bg-slate-900 hover:bg-slate-950">Browse Rooms</Button>
          </Link>
        </div>
      </div>

      {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <p className="text-sm font-semibold text-slate-900">Your patterns</p>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <p>
              <span className="font-medium">Most selected room:</span>{" "}
              {insights?.patterns?.most_common_room_type || "Not enough data yet"}
            </p>
            <p>
              <span className="font-medium">AC preference:</span> {insights?.patterns?.most_common_ac_type || "-"}
            </p>
            <p>
              <span className="font-medium">Average budget:</span>{" "}
              {insights?.patterns?.avg_budget != null ? `PKR ${insights.patterns.avg_budget}` : "-"}
            </p>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Suggestions improve as you book rooms and use the recommender more often.
          </p>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Suggested rooms</p>
            <Link className="text-sm font-semibold text-indigo-700 hover:text-indigo-800" to="/rooms">
              View all
            </Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(insights?.suggested_rooms || []).length ? (
              insights.suggested_rooms.map((r) => (
                <div key={r.id} className="rounded-xl border border-slate-200 p-4">
                  <p className="font-semibold">{r.room_type} Room</p>
                  <p className="text-xs font-semibold text-slate-500">{r.hotel_name || `Hotel #${r.hotel_id}`}</p>
                  <p className="text-sm text-slate-600">
                    {r.ac_type} - Capacity {r.capacity} - PKR {r.price}/night
                  </p>
                  <div className="mt-3">
                    <Link to={`/book/${r.id}`}>
                      <Button className="w-full">Book</Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-600">Book at least once to unlock smarter suggestions.</p>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <p className="text-sm font-semibold text-slate-900">Booking history</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-600">
              <tr>
                <th className="py-2 pr-4">Room</th>
                <th className="py-2 pr-4">Dates</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody className="text-slate-800">
              {bookings.length ? (
                bookings.map((b) => (
                  <tr key={b.id} className="border-t border-slate-100">
                    <td className="py-3 pr-4">
                      {b.room.room_type} ({b.room.ac_type})
                      <div className="text-xs text-slate-500">{b.room.hotel_name || `Hotel #${b.room.hotel_id}`}</div>
                    </td>
                    <td className="py-3 pr-4">
                      {b.start_date} to {b.end_date}
                    </td>
                    <td className="py-3 pr-4">PKR {b.total_price}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          b.status === "confirmed"
                            ? "bg-green-50 text-green-700"
                            : b.status === "cancelled"
                              ? "bg-slate-100 text-slate-700"
                              : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-4 text-slate-600">
                    No bookings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

