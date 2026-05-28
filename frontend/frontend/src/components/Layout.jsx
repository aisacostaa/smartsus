import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen p-8"
        style={{ background: "linear-gradient(135deg, #0f172a 0%, #0c1445 100%)" }}>
        {children}
      </main>
    </div>
  );
}