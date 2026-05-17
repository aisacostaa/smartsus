import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import { hospitaisAPI } from "../services/api";
import { Hospital, MapPin, Users, CheckCircle, XCircle } from "lucide-react";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function criarIcone(disponivel) {
  const cor = disponivel ? "#22c55e" : "#ef4444";
  return L.divIcon({
    html: `<div style="width:28px;height:28px;border-radius:50%;background:${cor};border:3px solid white;box-shadow:0 0 12px ${cor}88;display:flex;align-items:center;justify-content:center;">
      <svg width="12" height="12" fill="white" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
    </div>`,
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export default function Hospitais() {
  const [hospitais, setHospitais] = useState([]);
  const [selecionado, setSelecionado] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hospitaisAPI.listar().then(r => { setHospitais(r.data); setLoading(false); });
  }, []);

  const pct = (h) => Math.round((h.agendados_hoje / h.capacidade_dia) * 100);

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Hospitais</h2>
        <p className="text-slate-400 text-sm mt-1">10 hospitais parceiros na Grande São Paulo</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Lista */}
        <div className="xl:col-span-1 space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : hospitais.map(h => (
            <div key={h.id} onClick={() => setSelecionado(h)}
              className={`card p-4 cursor-pointer transition-all hover:border-blue-500/40 ${selecionado?.id === h.id ? "border-blue-500/60 bg-blue-900/20" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{h.nome}</p>
                  <p className="text-slate-500 text-xs mt-0.5">{h.bairro}</p>
                </div>
                {h.disponivel
                  ? <CheckCircle size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                  : <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />}
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Vagas hoje</span>
                  <span className={h.disponivel ? "text-green-400" : "text-red-400"}>
                    {h.vagas_hoje}/{h.capacidade_dia}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${pct(h)}%`, background: pct(h) >= 100 ? "#ef4444" : pct(h) > 70 ? "#f97316" : "#22c55e" }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mapa */}
        <div className="xl:col-span-2 card overflow-hidden" style={{ height: 600 }}>
          {!loading && (
            <MapContainer
              center={[-23.55, -46.63]} zoom={10}
              style={{ height: "100%", width: "100%", borderRadius: 16 }}>
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; OpenStreetMap &copy; CARTO'
              />
              {hospitais.map(h => (
                <Marker key={h.id} position={[h.lat, h.lng]} icon={criarIcone(h.disponivel)}
                  eventHandlers={{ click: () => setSelecionado(h) }}>
                  <Popup>
                    <div style={{ fontFamily: "Poppins, sans-serif", minWidth: 200 }}>
                      <p style={{ fontWeight: 700, marginBottom: 4 }}>{h.nome}</p>
                      <p style={{ color: "#94a3b8", fontSize: 12 }}>{h.endereco}</p>
                      <p style={{ color: h.disponivel ? "#22c55e" : "#ef4444", fontSize: 12, marginTop: 6, fontWeight: 600 }}>
                        {h.vagas_hoje} vagas disponíveis hoje
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
              {selecionado && (
                <Circle center={[selecionado.lat, selecionado.lng]}
                  radius={2000} color="#3b82f6" fillColor="#3b82f6" fillOpacity={0.1} />
              )}
            </MapContainer>
          )}
        </div>
      </div>

      {/* Detalhe hospital selecionado */}
      {selecionado && (
        <div className="card p-6 fade-in">
          <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
            <Hospital size={18} className="text-blue-400" />
            {selecionado.nome}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Endereço", value: selecionado.endereco },
              { label: "Bairro", value: selecionado.bairro },
              { label: "Vagas Hoje", value: `${selecionado.vagas_hoje} / ${selecionado.capacidade_dia}` },
              { label: "Status", value: selecionado.disponivel ? "Disponível" : "Lotado" },
            ].map(item => (
              <div key={item.label}>
                <p className="text-slate-400 text-xs mb-1">{item.label}</p>
                <p className="text-white font-medium text-sm">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
