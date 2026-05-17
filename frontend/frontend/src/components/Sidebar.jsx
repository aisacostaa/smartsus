import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, ListOrdered, Hospital, Activity, FlaskConical, BuildingIcon } from "lucide-react";

const links = [
  { to: "/",              icon: LayoutDashboard, label: "Dashboard"       },
  { to: "/fila",          icon: ListOrdered,     label: "Fila"            },
  { to: "/fila-hospital", icon: BuildingIcon,    label: "Fila por Hospital" },
  { to: "/pacientes",     icon: Users,           label: "Cadastro"        },
  { to: "/hospitais",     icon: Hospital,        label: "Hospitais"       },
  { to: "/simulacao",     icon: FlaskConical,    label: "Simulação"       },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 z-40 flex flex-col"
      style={{ background: "linear-gradient(180deg, #0f172a 0%, #1e3a8a 100%)", borderRight: "1px solid rgba(59,130,246,0.2)" }}>
      <div className="flex items-center gap-3 px-6 py-6 border-b border-blue-900/40">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center glow">
          <Activity size={20} className="text-white" />
        </div>
        <div>
          <h1 className="font-bold text-white text-lg leading-none">SmartSus</h1>
          <p className="text-blue-300 text-xs mt-0.5">Gestão Cirúrgica SUS</p>
        </div>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/50"
                  : "text-blue-200 hover:bg-blue-900/40 hover:text-white"
              }`
            }>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-6 py-4 border-t border-blue-900/40">
        <p className="text-blue-400 text-xs">v1.0.0 — SUS SP</p>
      </div>
    </aside>
  );
}
