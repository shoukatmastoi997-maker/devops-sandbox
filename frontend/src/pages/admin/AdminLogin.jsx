import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Card from "../../components/Card";
import Input from "../../components/Input";
import Button from "../../components/Button";
import { adminLogin } from "../../services/adminAuth";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await adminLogin(form);
      navigate("/admin");
    } catch (err) {
      setError(err?.response?.data?.message || "Admin login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Card>
        <h1 className="text-xl font-bold">Admin Login</h1>
        <p className="mt-1 text-sm text-slate-600">Restricted area. Admins only.</p>

        {error ? <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
            placeholder="admin@test.com"
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
            placeholder="123456"
          />
          <Button disabled={loading} className="w-full bg-slate-900 hover:bg-slate-950">
            {loading ? "Signing in..." : "Login as Admin"}
          </Button>
        </form>
      </Card>

      <p className="text-center text-sm text-slate-600">
        Back to{" "}
        <Link to="/" className="font-semibold text-indigo-700 hover:text-indigo-800">
          user site
        </Link>
      </p>
    </div>
  );
}

