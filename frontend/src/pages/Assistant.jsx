import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";
import api from "../services/api";

function Bubble({ side, children, meta }) {
  const base =
    side === "user"
      ? "ml-auto bg-slate-900 text-white"
      : "mr-auto bg-white text-slate-900 border border-slate-200";
  return (
    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-soft ${base}`}>
      <div className="whitespace-pre-wrap leading-6">{children}</div>
      {meta ? <div className="mt-2 text-xs opacity-70">{meta}</div> : null}
    </div>
  );
}

export default function Assistant() {
  const [items, setItems] = useState([
    {
      id: "m0",
      role: "assistant",
      text: "Tell me your budget (PKR), guests, and any preference like AC/non-AC. I will recommend rooms and explain why.",
      meta: null,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastSuggested, setLastSuggested] = useState([]);

  const scrollerRef = useRef(null);

  const quick = useMemo(
    () => [
      "Budget PKR 4000, guests 2, AC please",
      "I need a cheap room for 2 people",
      "Best option for family (4 people) within PKR 8000",
      "Suggest rooms for tonight to tomorrow",
    ],
    []
  );

  function scrollToBottom() {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }

  async function send(text) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    const userMsg = { id: `u${Date.now()}`, role: "user", text: msg, meta: null };
    setItems((s) => [...s, userMsg]);
    setInput("");
    setLoading(true);
    setTimeout(scrollToBottom, 0);

    try {
      const res = await api.post("/assistant/chat", { message: msg });
      const usedOpenai = res.data?.used_openai;
      const replyText = res.data?.reply || "I could not generate a reply. Please try again.";
      const suggested = res.data?.suggested_rooms || [];
      setLastSuggested(suggested);

      setItems((s) => [
        ...s,
        {
          id: `a${Date.now()}`,
          role: "assistant",
          text: replyText,
          meta: usedOpenai ? "AI mode: OpenAI" : "AI mode: Rules",
        },
      ]);
      setTimeout(scrollToBottom, 0);
    } catch (err) {
      setItems((s) => [
        ...s,
        {
          id: `e${Date.now()}`,
          role: "assistant",
          text: err?.response?.data?.message || "Chat failed. Please try again.",
          meta: "Error",
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(scrollToBottom, 0);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">AI Assistant</h1>
            <p className="mt-1 text-sm text-slate-600">Chat with the system and get room suggestions with reasons.</p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              className="bg-white text-slate-900 hover:bg-slate-50 border border-slate-200"
              onClick={() => {
                setItems([
                  {
                    id: "m0",
                    role: "assistant",
                    text: "Tell me your budget (PKR), guests, and any preference like AC/non-AC. I will recommend rooms and explain why.",
                    meta: null,
                  },
                ]);
                setLastSuggested([]);
              }}
            >
              Clear
            </Button>
          </div>
        </div>

        <div className="mt-5">
          <div ref={scrollerRef} className="h-[440px] overflow-y-auto rounded-xl bg-slate-50 p-4">
            <div className="flex flex-col gap-3">
              {items.map((m) => (
                <Bubble key={m.id} side={m.role} meta={m.meta}>
                  {m.text}
                </Bubble>
              ))}
              {loading ? (
                <Bubble side="assistant" meta="Thinking">
                  Working on it...
                </Bubble>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {quick.map((q) => (
              <button
                key={q}
                type="button"
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                onClick={() => send(q)}
              >
                {q}
              </button>
            ))}
          </div>

          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <textarea
              className="min-h-[44px] w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Type your request..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <Button disabled={loading} className="shrink-0">
              Send
            </Button>
          </form>
          <p className="mt-2 text-xs text-slate-500">Press Enter to send. Shift+Enter for a new line.</p>
        </div>
      </Card>

      <Card className="lg:col-span-1">
        <p className="text-sm font-semibold text-slate-900">Suggested Rooms</p>
        <p className="mt-1 text-sm text-slate-600">These are the rooms returned by the assistant API.</p>

        <div className="mt-4 space-y-3">
          {lastSuggested?.length ? (
            lastSuggested.map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-200 p-4">
                <p className="font-semibold">{r.room_type} Room</p>
                <p className="text-xs font-semibold text-slate-500">{r.hotel_name || `Hotel #${r.hotel_id}`}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {r.ac_type} - Capacity {r.capacity} - PKR {r.price}/night
                </p>
                <div className="mt-3">
                  <Link className="text-sm font-semibold text-indigo-700 hover:text-indigo-800" to={`/book/${r.id}`}>
                    Book this room
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              No suggestions yet. Send a message to the assistant.
            </div>
          )}
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold">OpenAI setup</p>
          <p className="mt-1 text-slate-600">
            Add your key to backend env as OPENAI_API_KEY. The key stays on the server.
          </p>
        </div>
      </Card>
    </div>
  );
}
