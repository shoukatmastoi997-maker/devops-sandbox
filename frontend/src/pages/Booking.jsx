import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import api from "../services/api";

export default function Booking() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [form, setForm] = useState({ start_date: "", end_date: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setError("");
      try {
        const res = await api.get("/rooms");
        const found = res.data.find((r) => String(r.id) === String(roomId));
        setRoom(found || null);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load room");
      }
    }
    load();
  }, [roomId]);

  const totalPreview = useMemo(() => {
    if (!room || !form.start_date || !form.end_date) return null;
    const s = new Date(form.start_date);
    const e = new Date(form.end_date);
    const nights = Math.floor((e - s) / (1000 * 60 * 60 * 24));
    if (Number.isNaN(nights) || nights <= 0) return null;
    return nights * room.price;
  }, [room, form.start_date, form.end_date]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.start_date || !form.end_date) {
      setError("Please select start and end dates");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/book", {
        room_id: Number(roomId),
        start_date: form.start_date,
        end_date: form.end_date,
      });
      navigate(`/payment/${res.data.booking.id}`);
    } catch (err) {
      setError(err?.response?.data?.message || "Booking failed");
    } finally {
      setLoading(false);
    }
  }

  if (!room) {
    return (
      <Card>
        <p className="text-sm text-slate-700">{error || "Room not found."}</p>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Book Room</h1>
        <p className="mt-1 text-sm text-slate-600">
          {room.hotel_name || `Hotel #${room.hotel_id}`} • {room.room_type} • {room.ac_type} • Capacity {room.capacity} • PKR{" "}
          {room.price}/night
        </p>
      </div>

      <Card>
        {error ? <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Start date"
            type="date"
            value={form.start_date}
            onChange={(e) => setForm((s) => ({ ...s, start_date: e.target.value }))}
          />
          <Input
            label="End date"
            type="date"
            value={form.end_date}
            onChange={(e) => setForm((s) => ({ ...s, end_date: e.target.value }))}
          />

          <div className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-semibold">Price preview</p>
            <p className="mt-1 text-slate-600">
              {totalPreview != null ? `Estimated total: PKR ${totalPreview}` : "Select valid dates to see total price."}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Overlapping bookings for the same room are blocked by backend availability logic.
            </p>
          </div>

          <div className="sm:col-span-2">
            <Button disabled={loading} className="w-full">
              {loading ? "Creating booking..." : "Continue to Payment"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
