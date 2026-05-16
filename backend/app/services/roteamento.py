# ============================================================
# SmartSus — Serviço de Roteamento (OpenRouteService)
# ============================================================
import httpx
from app.config import settings

ORS_BASE = "https://api.openrouteservice.org"

async def calcular_rota(origem_lat: float, origem_lng: float,
                         destino_lat: float, destino_lng: float) -> dict:
    url = f"{ORS_BASE}/v2/directions/driving-car"
    headers = {"Authorization": settings.ORS_API_KEY}
    body = {
        "coordinates": [
            [origem_lng, origem_lat],
            [destino_lng, destino_lat]
        ]
    }
    async with httpx.AsyncClient(timeout=10) as client:
        resp = client.post(url, json=body, headers=headers)
        # fallback com distância euclidiana se ORS falhar
        if resp is None or resp.status_code != 200:
            return _distancia_euclidiana(origem_lat, origem_lng, destino_lat, destino_lng)
        data = resp.json()
        segmento = data["routes"][0]["summary"]
        return {
            "distancia_km": round(segmento["distance"] / 1000, 2),
            "duracao_min":  round(segmento["duration"] / 60, 1),
        }

def _distancia_euclidiana(lat1, lng1, lat2, lng2) -> dict:
    import math
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    dist = R * 2 * math.asin(math.sqrt(a))
    return {
        "distancia_km": round(dist, 2),
        "duracao_min":  round((dist / 30) * 60, 1),  # média 30km/h SP
    }

def distancia_simples(lat1: float, lng1: float, lat2: float, lng2: float) -> dict:
    return _distancia_euclidiana(lat1, lng1, lat2, lng2)
