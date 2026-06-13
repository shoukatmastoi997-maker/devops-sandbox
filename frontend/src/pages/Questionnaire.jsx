import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Select from "../components/Select";
import Input from "../components/Input";
import Button from "../components/Button";
import api from "../services/api";

export default function Questionnaire() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    people_count: 1,
    ac_preference: "",
    budget: 3000,
    start_date: "",
    end_date: "",
    location: "",
    mode: "best_match",
    budget_strictness: "normal",
    comfort_priority: "balanced",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function validateStep(nextStep) {
    if (nextStep <= step) return true;
    if (step === 1) {
      if (!form.people_count || Number(form.people_count) < 1) {
        setError("Please select number of people");
        return false;
      }
      if ((form.start_date && !form.end_date) || (!form.start_date && form.end_date)) {
        setError("Please provide both start and end date, or leave both empty");
        return false;
      }
    }
    if (step === 2) {
      if (Number(form.budget) < 0) {
        setError("Budget must be non-negative");
        return false;
      }
    }
    setError("");
    return true;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!validateStep(3)) return;

    setLoading(true);
    try {
      const payload = {
        people_count: Number(form.people_count),
        budget: Number(form.budget),
        ac_preference: form.ac_preference || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        location: form.location.trim() ? form.location.trim() : null,
        mode: form.mode || "best_match",
        budget_strictness: form.budget_strictness || "normal",
        comfort_priority: form.comfort_priority || "balanced",
      };
      const res = await api.post("/recommend", payload);
      sessionStorage.setItem("lastRecommendation", JSON.stringify(res.data));
      navigate("/recommendation");
    } catch (err) {
      setError(err?.response?.data?.message || "Recommendation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AI Questionnaire</h1>
        <p className="mt-1 text-sm text-slate-600">
          Answer a few questions. We will recommend rooms based on your answers and your history.
        </p>
      </div>

      <Card>
        {error ? <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        <div className="mb-5 flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">Step {step} of 3</div>
          <div className="flex gap-2">
            <div className={`h-2 w-8 rounded-full ${step >= 1 ? "bg-indigo-600" : "bg-slate-200"}`} />
            <div className={`h-2 w-8 rounded-full ${step >= 2 ? "bg-indigo-600" : "bg-slate-200"}`} />
            <div className={`h-2 w-8 rounded-full ${step >= 3 ? "bg-indigo-600" : "bg-slate-200"}`} />
          </div>
        </div>

        <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
          {step === 1 ? (
            <>
              <Select
                label="Number of people"
                value={form.people_count}
                onChange={(e) => setForm((s) => ({ ...s, people_count: Number(e.target.value) }))}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5+</option>
              </Select>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 sm:col-span-2">
                <p className="font-semibold">Dates (optional)</p>
                <p className="mt-1 text-slate-600">If you provide dates, we exclude rooms that are already booked.</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
                </div>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Input
                label="Budget (PKR)"
                type="number"
                min={0}
                value={form.budget}
                onChange={(e) => setForm((s) => ({ ...s, budget: e.target.value }))}
                placeholder="e.g. 3000"
              />

              <Select
                label="AC preference (optional)"
                value={form.ac_preference}
                onChange={(e) => setForm((s) => ({ ...s, ac_preference: e.target.value }))}
              >
                <option value="">Auto</option>
                <option value="AC">AC</option>
                <option value="Non-AC">Non-AC</option>
              </Select>

              <Input
                label="Preferred location (optional)"
                value={form.location}
                onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))}
                placeholder="e.g. Karachi, Lahore"
              />

              <Select
                label="Budget strictness"
                value={form.budget_strictness}
                onChange={(e) => setForm((s) => ({ ...s, budget_strictness: e.target.value }))}
              >
                <option value="strict">Strict (do not exceed)</option>
                <option value="normal">Normal</option>
                <option value="flexible">Flexible</option>
              </Select>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <Select
                label="Comfort vs budget"
                value={form.comfort_priority}
                onChange={(e) => setForm((s) => ({ ...s, comfort_priority: e.target.value }))}
              >
                <option value="budget">Prefer lowest price</option>
                <option value="balanced">Balanced</option>
                <option value="comfort">Prefer comfort</option>
              </Select>

              <Select
                label="Recommendation mode"
                value={form.mode}
                onChange={(e) => setForm((s) => ({ ...s, mode: e.target.value }))}
              >
                <option value="best_match">Best match</option>
                <option value="personalized">Personalized</option>
                <option value="lowest_price">Lowest price</option>
              </Select>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 sm:col-span-2">
                <p className="font-semibold">Review</p>
                <p className="mt-1 text-slate-600">
                  We will rank rooms with an explainable score and show the reasons for each suggestion.
                </p>
              </div>
            </>
          ) : null}

          <div className="sm:col-span-2 flex gap-2">
            <Button
              type="button"
              className="bg-white text-slate-900 hover:bg-slate-50 border border-slate-200"
              disabled={loading || step === 1}
              onClick={() => {
                setError("");
                setStep((s) => Math.max(1, s - 1));
              }}
            >
              Back
            </Button>

            {step < 3 ? (
              <Button
                type="button"
                className="w-full"
                disabled={loading}
                onClick={() => {
                  if (!validateStep(step + 1)) return;
                  setStep((s) => Math.min(3, s + 1));
                }}
              >
                Next
              </Button>
            ) : (
              <Button disabled={loading} className="w-full">
                {loading ? "Thinking..." : "Get Recommendation"}
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
