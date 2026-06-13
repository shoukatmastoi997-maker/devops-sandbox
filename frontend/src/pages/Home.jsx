import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { getToken } from "../services/storage";

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

const slideUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

const cardIn = {
  hidden: { opacity: 0, scale: 0.98, y: 10 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

export default function Home() {
  const isAuthed = Boolean(getToken());

  return (
    <motion.section
      variants={fadeIn}
      initial="hidden"
      animate="show"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-50 via-white to-indigo-50 py-16 px-6 shadow-lg ring-1 ring-slate-200"
    >
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />

      <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-2">
        {/* Left */}
        <div className="space-y-6">
          <motion.div variants={slideUp} className="space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 backdrop-blur">
              Final Year Project • Hotel Reservation
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Smart Hotel Booking System
            </h1>
            <p className="max-w-xl text-base leading-7 text-slate-700 sm:text-lg">
              I built this system to make hotel booking simple and practical. Instead of scrolling through endless
              options, users just enter their needs like number of people, budget, and room type preference. Based on
              this, the system suggests the most suitable room and allows booking with proper date validation. It’s
              designed to feel like a real-world booking experience rather than just a demo.
            </p>
          </motion.div>

          <motion.div variants={slideUp} className="max-w-xl space-y-2 text-sm text-slate-600 sm:text-base">
            <p>This project simulates a real hotel reservation flow with booking history, availability checking, and a simple payment step.</p>
            <p>The focus was on making it practical and easy to understand.</p>
          </motion.div>

          <motion.div variants={slideUp} className="flex flex-wrap gap-3">
            {isAuthed ? (
              <>
                <Link to="/questionnaire">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/35"
                  >
                    Get Recommendation
                  </motion.button>
                </Link>
                <Link to="/dashboard">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20"
                  >
                    Open Dashboard
                  </motion.button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/signup">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/35"
                  >
                    Create Account
                  </motion.button>
                </Link>
                <Link to="/login">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 hover:shadow-slate-900/20"
                  >
                    Login
                  </motion.button>
                </Link>
              </>
            )}
          </motion.div>

          <motion.div variants={slideUp} className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <span className="rounded-full bg-white/70 px-3 py-1 ring-1 ring-slate-200 backdrop-blur">
              JWT + bcrypt
            </span>
            <span className="rounded-full bg-white/70 px-3 py-1 ring-1 ring-slate-200 backdrop-blur">
              SQLite database
            </span>
            <span className="rounded-full bg-white/70 px-3 py-1 ring-1 ring-slate-200 backdrop-blur">
              Booking overlap protection
            </span>
            <Link className="font-semibold text-indigo-700 hover:text-indigo-800" to="/admin/login">
              Admin login →
            </Link>
          </motion.div>
        </div>

        {/* Right */}
        <motion.aside variants={cardIn} className="rounded-2xl bg-white/80 p-7 shadow-xl ring-1 ring-slate-200 backdrop-blur">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">How this system works</h2>
              <p className="mt-1 text-sm text-slate-600">A quick overview of the real features.</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-500/25">
              ✓
            </div>
          </div>

          <ul className="mt-5 space-y-3 text-sm text-slate-700">
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
              Users create an account and provide booking preferences
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
              System suggests rooms based on people count and budget
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
              Booking system prevents selecting already reserved dates
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
              Previous bookings are stored and reused for better suggestions
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
              Demo payment flow is included for complete experience
            </li>
          </ul>

          <div className="mt-6 rounded-2xl bg-gradient-to-r from-slate-50 to-indigo-50 p-4 ring-1 ring-slate-200">
            <p className="text-sm font-semibold text-slate-900">Tip</p>
            <p className="mt-1 text-sm text-slate-600">
              For the best demo: sign up → get recommendation → book dates → pay → check dashboard history.
            </p>
          </div>
        </motion.aside>
      </div>
    </motion.section>
  );
}

