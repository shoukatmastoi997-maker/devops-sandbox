export default function Select({ label, error, children, className = "", ...props }) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label ? <label className="text-sm font-medium text-slate-700">{label}</label> : null}
      <select
        className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm ${
          error ? "border-red-500" : ""
        }`}
        {...props}
      >
        {children}
      </select>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

