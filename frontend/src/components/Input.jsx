export default function Input({ label, error, className = "", ...props }) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label ? <label className="text-sm font-medium text-slate-700">{label}</label> : null}
      <input
        className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 ${
          error ? "border-red-500" : ""
        }`}
        {...props}
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

