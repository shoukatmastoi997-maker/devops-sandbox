import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import { signup } from "../services/auth";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.email.trim()) next.email = "Email is required";
    if (form.password.length < 6) next.password = "Password should be at least 6 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await signup(form);
      navigate("/dashboard");
    } catch (err) {
      setErrors({ form: err?.response?.data?.message || "Signup failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <Card>
        <h2 className="text-xl font-bold">Create your account</h2>
        <p className="mt-1 text-sm text-slate-600">Sign up to start booking rooms.</p>
        {errors.form ? <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors.form}</p> : null}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            error={errors.name}
            placeholder="Your name"
          />
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
            placeholder="Minimum 6 characters"
          />
          <Button disabled={loading} className="w-full">
            {loading ? "Creating..." : "Sign up"}
          </Button>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Already have an account?{" "}
          <Link className="font-semibold text-indigo-700 hover:text-indigo-800" to="/login">
            Login
          </Link>
        </p>
      </Card>
    </div>
  );
}

