import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const statusColor = {
  "en-route": "#22c55e",
  "disrupted": "#ef4444",
  "rerouted": "#eab308"
};
const statusLabel = {
  "en-route": "En Route",
  "disrupted": "Disrupted",
  "rerouted": "Rerouted"
};

function getMidpoint(coords) {
  if (!Array.isArray(coords) || coords.length < 2) return coords[0] || [0, 0];
  const midIdx = Math.floor(coords.length / 2);
  return coords[midIdx];
}

const GeoMap = () => {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const popupRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!mapRef.current) return;
    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }
    // Center on US
    const center = [39.8283, -98.5795];
    leafletMapRef.current = L.map(mapRef.current, {
      center,
      zoom: 5,
      zoomControl: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(leafletMapRef.current);

    // Load all shipments from localStorage
    let shipments = [];
    try {
      shipments = JSON.parse(localStorage.getItem("shipments")) || [];
    } catch (e) {
      shipments = [];
    }
    shipments.forEach((shipment) => {
      // Plot original route (selectedRoute.geojson)
      if (shipment.selectedRoute && shipment.selectedRoute.geojson) {
        const feature = shipment.selectedRoute.geojson;
        L.geoJSON(feature, {
          style: {
            color: statusColor[shipment.status] || '#2563eb',
            weight: 5,
            opacity: 0.92,
            lineCap: 'round',
            lineJoin: 'round',
            className: 'route-polyline'
          },
          onEachFeature: (feature, layer) => {
            layer.on('mouseover', function () {
              layer.setStyle({ opacity: 1, dashArray: '2,10', filter: 'drop-shadow(0 0 2px #3b82f6)' });
            });
            layer.on('mouseout', function () {
              layer.setStyle({ opacity: 0.92, dashArray: null, filter: '' });
            });
            layer.on('click', function () {
              if (popupRef.current) leafletMapRef.current.closePopup(popupRef.current);
              const coords = feature.geometry.coordinates;
              const midpoint = getMidpoint(coords);
              const latlng = [midpoint[1], midpoint[0]];
              const p = shipment;
              let html = `
                <div style="min-width:240px;max-width:320px;padding:12px 8px;border-radius:16px;background:white;color:#222;box-shadow:0 2px 18px #0002;font-family:sans-serif;">
                  <div style="font-size:1.15rem;font-weight:700;margin-bottom:2px;">${p.origin} <span style='color:#3b82f6;'>→</span> ${p.destination}</div>
                  <div style="font-size:1rem;color:#2563eb;font-weight:500;margin-bottom:2px;">${p.productName}</div>
                  <div style="font-size:0.8rem;color:#888;margin-bottom:6px;">${p.shipmentDate} | Priority: ${p.priority}</div>
                  <div style="display:flex;gap:10px;margin-bottom:6px;">
                    <div style="background:#f3f4f6;padding:3px 8px;border-radius:8px;font-size:0.8rem;">ETA: <b>${p.selectedRoute.estimatedTime || '--'} days</b></div>
                    <div style="background:#f3f4f6;padding:3px 8px;border-radius:8px;font-size:0.8rem;">Cost: <b>${p.selectedRoute.cost ? '$'+p.selectedRoute.cost : '--'}</b></div>
                    <div style="background:#f3f4f6;padding:3px 8px;border-radius:8px;font-size:0.8rem;">Emissions: <b>${p.selectedRoute.emissions || '--'} kg CO₂</b></div>
                  </div>
                  <div style="font-size:0.85rem;margin-bottom:4px;">Status: <span style="color:white;background:${statusColor[p.status]};border-radius:6px;padding:2px 8px;">${statusLabel[p.status]}</span></div>
                  ${p.status === 'rerouted' && p.reroute ? `<div style='font-size:0.8rem;margin-top:4px;background:#fef9c3;border-radius:8px;padding:5px 8px;'><b>Rerouted:</b> ${p.route?.mode || ''} → ${p.reroute.selectedRoute?.mode || ''} (from ${p.reroute.from || p.origin})</div>` : ''}
                </div>
              `;
              popupRef.current = L.popup({ closeButton: true, autoPan: true, className: 'dashboard-popup', offset: [0, -8] })
                .setLatLng(latlng)
                .setContent(html)
                .openOn(leafletMapRef.current);
            });
          }
        }).addTo(leafletMapRef.current);
        // Place origin/destination markers
        const coords = feature.geometry.coordinates;
        if (coords.length > 0) {
          const start = coords[0];
          const end = coords[coords.length - 1];
          L.marker([start[1], start[0]], { icon: L.icon({ iconUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.3/dist/images/marker-icon.png", iconSize: [25, 41], iconAnchor: [12, 41] }) }).addTo(leafletMapRef.current);
          L.marker([end[1], end[0]], { icon: L.icon({ iconUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.3/dist/images/marker-icon.png", iconSize: [25, 41], iconAnchor: [12, 41] }) }).addTo(leafletMapRef.current);
        }
      }
      // Plot reroute if present
      if (shipment.reroute && shipment.reroute.selectedRoute && shipment.reroute.selectedRoute.geojson) {
        const feature = shipment.reroute.selectedRoute.geojson;
        L.geoJSON(feature, {
          style: {
            color: statusColor['rerouted'],
            weight: 4,
            opacity: 0.7,
            dashArray: '5,10',
            className: 'route-polyline reroute-polyline'
          },
        }).addTo(leafletMapRef.current);
      }
    });
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 9999 }}>
      <button
        className="absolute top-6 left-6 z-[11000] bg-gray-900 text-white px-5 py-2 rounded-lg shadow-lg hover:bg-gray-800 transition font-semibold text-base"
        onClick={() => navigate('/dashboard')}
      >
        ← Back to Dashboard
      </button>
      <div ref={mapRef} style={{ height: "100vh", width: "100vw" }}></div>
    </div>
  );
};

export default GeoMap;
