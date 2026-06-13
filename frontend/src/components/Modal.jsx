export default function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" onMouseDown={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-soft"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-lg font-bold">{title}</p>
            <p className="text-xs text-slate-500">Click outside to close.</p>
          </div>
          <button className="rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-50" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

