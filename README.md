# SmartSus

Sistema inteligente de gestão da fila cirúrgica do SUS.

## Como rodar localmente

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env           # preencha suas credenciais
uvicorn app.main:app --reload
```

### Banco de dados
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p smartsus < database/seed.sql
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

## Stack
- **Backend:** Python + FastAPI
- **Banco:** MySQL
- **Frontend:** React + Vite + TailwindCSS
- **Mapas:** Leaflet.js
- **Rotas:** OpenRouteService API
