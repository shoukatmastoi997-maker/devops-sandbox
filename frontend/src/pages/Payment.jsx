import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import api from "../services/api";

export default function Payment() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ card_number: "", expiry: "", cvv: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await api.post("/payment", {
        booking_id: Number(bookingId),
        card_number: form.card_number,
        expiry: form.expiry,
        cvv: form.cvv,
      });
      setSuccess(res.data.message || "Payment Successful");
      setTimeout(() => navigate("/dashboard"), 900);
    } catch (err) {
      setError(err?.response?.data?.message || "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <h1 className="text-xl font-bold">Demo Payment</h1>
        <p className="mt-1 text-sm text-slate-600">
          This is a fake gateway for project demonstration. Backend always returns success.
        </p>

        {error ? <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        {success ? <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</p> : null}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Input
            label="Card Number"
            value={form.card_number}
            onChange={(e) => setForm((s) => ({ ...s, card_number: e.target.value }))}
            placeholder="4111 1111 1111 1111"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Expiry"
              value={form.expiry}
              onChange={(e) => setForm((s) => ({ ...s, expiry: e.target.value }))}
              placeholder="MM/YY"
            />
            <Input
              label="CVV"
              value={form.cvv}
              onChange={(e) => setForm((s) => ({ ...s, cvv: e.target.value }))}
              placeholder="123"
            />
          </div>
          <Button disabled={loading} className="w-full">
            {loading ? "Processing..." : "Pay Now"}
          </Button>
        </form>

        <p className="mt-4 text-xs text-slate-500">
          Want to skip? Go back to{" "}
          <Link className="font-semibold text-indigo-700 hover:text-indigo-800" to="/dashboard">
            dashboard
          </Link>
          .
        </p>
      </Card>
    </div>
  );
}

