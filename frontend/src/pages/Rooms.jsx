import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../components/Card";
import Select from "../components/Select";
import Input from "../components/Input";
import Button from "../components/Button";
import api from "../services/api";

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ capacity: "", max_price: "", ac_type: "", sort: "price_asc" });

  useEffect(() => {
    async function load() {
      setError("");
      try {
        const res = await api.get("/rooms");
        setRooms(res.data);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load rooms");
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = [...rooms];
    if (filters.capacity) list = list.filter((r) => r.capacity >= Number(filters.capacity));
    if (filters.max_price) list = list.filter((r) => r.price <= Number(filters.max_price));
    if (filters.ac_type) list = list.filter((r) => r.ac_type === filters.ac_type);
    list.sort((a, b) => (filters.sort === "price_desc" ? b.price - a.price : a.price - b.price));
    return list;
  }, [rooms, filters]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Rooms</h1>
          <p className="mt-1 text-sm text-slate-600">Filter and sort rooms (bonus feature).</p>
        </div>
        <Link to="/questionnaire">
          <Button>AI Recommend</Button>
        </Link>
      </div>

      {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      <Card>
        <div className="grid gap-3 md:grid-cols-4">
          <Input
            label="Min capacity"
            type="number"
            min={1}
            value={filters.capacity}
            onChange={(e) => setFilters((s) => ({ ...s, capacity: e.target.value }))}
            placeholder="e.g. 2"
          />
          <Input
            label="Max price (PKR)"
            type="number"
            min={0}
            value={filters.max_price}
            onChange={(e) => setFilters((s) => ({ ...s, max_price: e.target.value }))}
            placeholder="e.g. 5000"
          />
          <Select
            label="AC type"
            value={filters.ac_type}
            onChange={(e) => setFilters((s) => ({ ...s, ac_type: e.target.value }))}
          >
            <option value="">All</option>
            <option value="AC">AC</option>
            <option value="Non-AC">Non-AC</option>
          </Select>
          <Select
            label="Sort"
            value={filters.sort}
            onChange={(e) => setFilters((s) => ({ ...s, sort: e.target.value }))}
          >
            <option value="price_asc">Price: low → high</option>
            <option value="price_desc">Price: high → low</option>
          </Select>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => (
          <Card key={r.id} className="border border-slate-100">
            <p className="text-lg font-bold">{r.room_type} Room</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{r.hotel_name || `Hotel #${r.hotel_id}`}</p>
            <p className="mt-1 text-sm text-slate-600">
              {r.ac_type} • Capacity {r.capacity}
            </p>
            <p className="mt-3 text-2xl font-bold">PKR {r.price}</p>
            <p className="text-sm text-slate-500">per night</p>
            <div className="mt-4">
              <Link to={`/book/${r.id}`}>
                <Button className="w-full">Book now</Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
