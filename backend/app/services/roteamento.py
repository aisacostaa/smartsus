# ============================================================
# SmartSus — Serviço de Roteamento (OpenRouteService)
# ============================================================
import httpx
import math
from app.config import settings

ORS_BASE = "https://api.openrouteservice.org"

async def calcular_rota(origem_lat: float, origem_lng: float,
                         destino_lat: float, destino_lng: float) -> dict:
    """Calcula rota real via OpenRouteService."""
    if not settings.ORS_API_KEY:
        return _distancia_euclidiana(origem_lat, origem_lng, destino_lat, destino_lng)
    
    url = f"{ORS_BASE}/v2/directions/driving-car"
    headers = {
        "Authorization": settings.ORS_API_KEY,
        "Content-Type": "application/json"
    }
    body = {
        "coordinates": [
            [origem_lng, origem_lat],
            [destino_lng, destino_lat]
        ]
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(url, json=body, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                segmento = data["routes"][0]["summary"]
                return {
                    "distancia_km": round(segmento["distance"] / 1000, 2),
                    "duracao_min":  round(segmento["duration"] / 60, 1),
                    "fonte": "openrouteservice"
                }
    except Exception:
        pass
    return _distancia_euclidiana(origem_lat, origem_lng, destino_lat, destino_lng)

def distancia_simples(lat1: float, lng1: float, lat2: float, lng2: float) -> dict:
    """Distância euclidiana para uso síncrono (alocação)."""
    return _distancia_euclidiana(lat1, lng1, lat2, lng2)

def _distancia_euclidiana(lat1, lng1, lat2, lng2) -> dict:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    dist = R * 2 * math.asin(math.sqrt(a))
    return {
        "distancia_km": round(dist, 2),
        "duracao_min":  round((dist / 30) * 60, 1),
        "fonte": "euclidiana"
    }
