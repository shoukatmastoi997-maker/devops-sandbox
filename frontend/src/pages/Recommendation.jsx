import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import api from "../services/api";

function ScoreBar({ score }) {
  const s = Math.max(0, Math.min(100, Number(score || 0)));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className="h-full rounded-full bg-indigo-600" style={{ width: `${s}%` }} />
    </div>
  );
}

export default function Recommendation() {
  const navigate = useNavigate();
  const recRaw = sessionStorage.getItem("lastRecommendation");
  const rec = recRaw ? JSON.parse(recRaw) : null;

  const ranked = useMemo(() => rec?.ranked_rooms || [], [rec]);
  const topPick = rec?.top_pick || ranked?.[0] || null;

  const [insights, setInsights] = useState(null);

  useEffect(() => {
    let mounted = true;
    api
      .get("/user/insights")
      .then((res) => {
        if (mounted) setInsights(res.data);
      })
      .catch(() => {
        /* optional */
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (!rec) {
    return (
      <Card>
        <p className="text-sm text-slate-700">No recommendation found. Please run the questionnaire.</p>
        <div className="mt-4">
          <Link to="/questionnaire">
            <Button>Go to Questionnaire</Button>
          </Link>
        </div>
      </Card>
    );
  }

  const list = ranked?.length ? ranked : rec.matching_rooms || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Your AI Recommendation</h1>
          <p className="mt-1 text-sm text-slate-600">
            Explainable scoring based on group size, budget, preferences, availability, and your history.
          </p>
        </div>
        <Button className="bg-slate-900 hover:bg-slate-950" onClick={() => navigate("/questionnaire")}>
          Try Again
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <p className="text-sm font-semibold text-slate-900">Result</p>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <p>
              <span className="font-medium">Room type:</span> {rec.recommended_room_type}
            </p>
            <p>
              <span className="font-medium">AC type:</span> {rec.recommended_ac_type}
            </p>
            <p>
              <span className="font-medium">Estimated price:</span>{" "}
              {rec.estimated_price ? `PKR ${rec.estimated_price}/night` : "-"}
            </p>
          </div>
          <p className="mt-4 text-xs text-slate-500">If people count is 5+, the system recommends "Multiple Rooms".</p>

          {topPick ? (
            <div className="mt-5 rounded-xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">Top pick</p>
              <p className="mt-2 font-semibold">
                {topPick.room_type} Room{" "}
                <span className="text-xs font-semibold text-slate-500">
                  {topPick.hotel_name || `Hotel #${topPick.hotel_id}`}
                </span>
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {topPick.ac_type} • Capacity {topPick.capacity} • PKR {topPick.price}/night
              </p>

              {"score" in topPick ? (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Match score</span>
                    <span className="font-semibold">{topPick.score}/100</span>
                  </div>
                  <ScoreBar score={topPick.score} />
                </div>
              ) : null}

              {topPick.reasons?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {topPick.reasons.map((r) => (
                    <span key={r} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {r}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-4">
                <Link to={`/book/${topPick.id}`}>
                  <Button className="w-full">Book top pick</Button>
                </Link>
              </div>
            </div>
          ) : null}
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">{ranked?.length ? "Ranked rooms" : "Matching rooms"}</p>
            <Link className="text-sm font-semibold text-indigo-700 hover:text-indigo-800" to="/rooms">
              Browse all
            </Link>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {list?.length ? (
              list.map((r) => (
                <div key={r.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{r.room_type} Room</p>
                      <p className="text-xs font-semibold text-slate-500">{r.hotel_name || `Hotel #${r.hotel_id}`}</p>
                    </div>
                    {"score" in r ? (
                      <div className="shrink-0 rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">
                        {r.score}/100
                      </div>
                    ) : null}
                  </div>

                  <p className="mt-1 text-sm text-slate-600">
                    {r.ac_type} • Capacity {r.capacity} • PKR {r.price}/night
                  </p>

                  {"score" in r ? (
                    <div className="mt-3">
                      <ScoreBar score={r.score} />
                    </div>
                  ) : null}

                  {r.reasons?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {r.reasons.map((x) => (
                        <span key={x} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                          {x}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-4">
                    <Link to={`/book/${r.id}`}>
                      <Button className="w-full">Book</Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-600">No rooms matched. Try adjusting budget or preferences.</p>
            )}
          </div>
        </Card>
      </div>

      {insights ? (
        <Card>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">Personalization insights</p>
              <p className="mt-1 text-sm text-slate-600">
                Based on your last {insights?.patterns?.total_bookings_considered || 0} bookings and{" "}
                {insights?.patterns?.total_preferences_considered || 0} recommendation requests.
              </p>
            </div>
            <Link className="text-sm font-semibold text-indigo-700 hover:text-indigo-800" to="/dashboard">
              View dashboard
            </Link>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-semibold text-slate-500">Most common room type</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{insights?.patterns?.most_common_room_type || "-"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-semibold text-slate-500">Most common AC type</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{insights?.patterns?.most_common_ac_type || "-"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-semibold text-slate-500">Average budget</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {insights?.patterns?.avg_budget ? `PKR ${insights.patterns.avg_budget}` : "-"}
              </p>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

