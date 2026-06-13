import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import { login } from "../services/auth";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const next = {};
    if (!form.email.trim()) next.email = "Email is required";
    if (!form.password) next.password = "Password is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await login(form);
      navigate("/dashboard");
    } catch (err) {
      setErrors({ form: err?.response?.data?.message || "Login failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <h2 className="text-xl font-bold">Welcome back</h2>
        <p className="mt-1 text-sm text-slate-600">Login to continue.</p>
        {errors.form ? <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors.form}</p> : null}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
            error={errors.email}
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
            error={errors.password}
            placeholder="Your password"
          />
          <Button disabled={loading} className="w-full">
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          New user?{" "}
          <Link className="font-semibold text-indigo-700 hover:text-indigo-800" to="/signup">
            Create an account
          </Link>
        </p>
      </Card>
    </div>
  );
}

