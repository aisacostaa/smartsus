import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Users, ListOrdered, Hospital,
  Building2, CalendarDays, Stethoscope, FlaskConical, Brain
} from "lucide-react";
import { useApp } from "../context/AppContext";

const links = [
  { to: "/",              icon: LayoutDashboard, label: "Dashboard"         },
  { to: "/fila",          icon: ListOrdered,     label: "Fila de Espera"    },
  { to: "/fila-hospital", icon: Building2,       label: "Fila por Hospital" },
  { to: "/agenda",        icon: CalendarDays,    label: "Agenda"            },
  { to: "/pacientes",     icon: Users,           label: "Cadastro"          },
  { to: "/hospitais",     icon: Hospital,        label: "Hospitais"         },
  { to: "/modelagem",     icon: Brain,           label: "Modelagem PO"      },
];

export default function Sidebar() {
  const { fila, agendados } = useApp();
  const criticos = fila.filter(p => p.critico).length;

  return (
    <aside className="sidebar fixed left-0 top-0 h-full w-64 z-40 flex flex-col">
      {/* Linha topo gradiente */}
      <div style={{ height: 3, background: "linear-gradient(90deg, #1a56db, #06b6d4, #1a56db)", backgroundSize: "200%", animation: "gradientShift 4s ease infinite" }} />

      {/* Logo */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-shrink-0">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #1a56db, #06b6d4)", boxShadow: "0 8px 24px rgba(26,86,219,0.5)" }}>
              <Stethoscope size={20} className="text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2"
              style={{ borderColor: "#0a1628" }} />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg leading-none">SmartSus</h1>
            <p className="text-xs mt-0.5" style={{ color: "rgba(148,163,184,0.55)" }}>Gestão Cirúrgica · SUS SP</p>
          </div>
        </div>

        {/* Stats rápidos */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-2xl text-center"
            style={{ background: "linear-gradient(135deg, rgba(26,86,219,0.25), rgba(6,182,212,0.1))", border: "1px solid rgba(59,130,246,0.2)" }}>
            <p className="text-white font-bold text-xl leading-none">{fila.length}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(148,163,184,0.6)" }}>Aguardando</p>
          </div>
          <div className="p-3 rounded-2xl text-center"
            style={{
              background: criticos > 0
                ? "linear-gradient(135deg, rgba(239,68,68,0.25), rgba(239,68,68,0.1))"
                : "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.08))",
              border: `1px solid ${criticos > 0 ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.2)"}`,
            }}>
            <p className={`font-bold text-xl leading-none ${criticos > 0 ? "text-red-400" : "text-emerald-400"}`}>{criticos}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(148,163,184,0.6)" }}>Críticos</p>
          </div>
        </div>
      </div>

      <div className="divider-gradient mx-4 mb-3" />

      {/* Navegação */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-2">
        <p className="text-xs font-semibold px-3 mb-2 mt-1" style={{ color: "rgba(148,163,184,0.35)", letterSpacing: "0.08em" }}>NAVEGAÇÃO</p>
        {links.slice(0, 4).map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === "/"}
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
            <Icon size={15} />
            <span>{label}</span>
            {to === "/fila" && criticos > 0 && (
              <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(239,68,68,0.2)", color: "#f87171" }}>{criticos}</span>
            )}
            {to === "/fila" && agendados.length > 0 && criticos === 0 && (
              <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: "rgba(59,130,246,0.2)", color: "#93c5fd" }}>{agendados.length}</span>
            )}
          </NavLink>
        ))}

        <p className="text-xs font-semibold px-3 mb-2 mt-4" style={{ color: "rgba(148,163,184,0.35)", letterSpacing: "0.08em" }}>GESTÃO</p>
        {links.slice(4).map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === "/"}
            className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}>
            <Icon size={15} />
            <span>{label}</span>
            {to === "/modelagem" && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(167,139,250,0.2))", color: "#c4b5fd", border: "1px solid rgba(167,139,250,0.2)" }}>PO</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="divider-gradient mx-4" />

      {/* Footer */}
      <div className="p-4">
        <div className="flex items-center gap-2 p-3 rounded-xl"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-white font-medium truncate">Sistema Online</p>
            <p className="text-xs truncate" style={{ color: "rgba(148,163,184,0.4)" }}>v1.0.0 · PuLP CBC Solver</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
