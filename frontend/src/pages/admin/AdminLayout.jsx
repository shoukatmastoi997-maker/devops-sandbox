import AdminSidebar from "../../components/AdminSidebar";

export default function AdminLayout({ title, children }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <AdminSidebar />
      <div className="space-y-4">
        {title ? <h1 className="text-2xl font-bold">{title}</h1> : null}
        {children}
      </div>
    </div>
  );
}

