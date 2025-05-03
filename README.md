# 🌍 Tavi – AI-Powered Multimodal Logistics Planner

Tavi is a smart, disruption-aware logistics dashboard that functions like _Google Maps for freight_. It enables logistics planners to dynamically route shipments across road, rail, air, and sea, optimize trade-offs like cost vs. speed, and visually track all active and completed shipments on an interactive map.

---

## 🚀 Features

- 📦 Create new shipments by entering origin, destination, product, date, and priority
- 🧠 Backend CrewAI agent generates multimodal route options based on real transport data
- 🗺️ Visualize routes on a 2D interactive map with plotted paths and status-aware markers
- 🔁 Handle disruptions with intelligent rerouting from new origins
- ✅ Fully responsive dashboard showing active and completed shipments
- 🗃️ Data-driven routing grounded in sources like:
  - U.S. Bureau of Transportation Statistics
  - OpenStreetMap
  - Freight Analysis Framework (FAF5)

---

## 🛠 Tech Stack

- **Frontend:** React, Tailwind CSS, React Leaflet, GeoJSON
- **Backend:** FastAPI, CrewAI, LiteLLM, Python
- **Agent:** LLM-based planner that returns route metadata + GeoJSON LineString
- **Storage:** LocalStorage (frontend); future-ready for DB integration

---

## ⚙️ Getting Started

### 🔧 Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd backend
pip install -r requirements.txt
```

### 🏃 Run Locally 

```bash
# Frontend
npm run dev

# Backend
uvicorn backend.main:app --reload
```

## 📌 Future Roadmap

 Route preference toggles (cost, emissions, time)

 International route logic (treaty, customs, conflict zones)

 Destination filtering based on graph connectivity

 Optimized rerouting simulation engine

 3D globe-based visualization

## 👩‍💻 Team
Alyssa – Frontend lead, UI/UX, map integration

Mihir – Backend agent, API design, reroute engine

Rohan – Graph logic, data integration, coordination layer

## 📄 License
MIT – Free to use, modify, and build upon. 

## 📝 Acknowledgments
MIT Global AI Hackathon 2025 
