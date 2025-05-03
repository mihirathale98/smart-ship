import React, { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// For demo, keep one route with all info in properties
const TEST_ROUTE = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        origin: "Boston",
        destination: "Chicago",
        productName: "Test GeoJSON Route",
        shipmentDate: "2025-05-02",
        priority: "fastest-delivery",
        status: "en-route",
        eta: "3 days",
        cost: "$1500",
        emissions: "400 kg CO₂",
        description: "Optimized route from Boston to Chicago avoiding tolls and prioritizing scenic views.",
        mode: "Custom",
        oldMode: "Rail",
        newMode: "Custom",
        rerouteOrigin: "Cleveland"
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [-71.0589, 42.3601], // Boston, MA
          [-72.6131, 42.2928],
          [-73.6016, 42.2655],
          [-74.1585, 42.3871],
          [-75.9296, 42.5822],
          [-77.2624, 42.6436],
          [-78.5640, 42.7325],
          [-80.3377, 42.6758],
          [-81.5294, 41.5558],
          [-82.0577, 41.5131],
          [-87.6298, 41.8781] // Chicago, IL
        ]
      }
    }
  ]
};

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
  // Find halfway along the route
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
    // Center on Boston
    const center = [42.3601, -71.0589];
    leafletMapRef.current = L.map(mapRef.current, {
      center,
      zoom: 6,
      zoomControl: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(leafletMapRef.current);

    // Draw GeoJSON with subtle hover
    function style(feature) {
      const baseColor = statusColor[feature.properties.status] || '#2563eb';
      return {
        color: baseColor,
        weight: 5,
        opacity: 0.92,
        dashArray: null,
        lineCap: 'round',
        lineJoin: 'round',
        cursor: 'pointer',
        className: 'route-polyline'
      };
    }
    function highlightStyle(feature) {
      const baseColor = statusColor[feature.properties.status] || '#2563eb';
      return {
        color: baseColor,
        weight: 5,
        opacity: 1,
        dashArray: '2,10',
        lineCap: 'round',
        lineJoin: 'round',
        cursor: 'pointer',
        className: 'route-polyline-hover',
        filter: 'drop-shadow(0 0 2px #3b82f6)'
      };
    }
    const geojsonLayer = L.geoJSON(TEST_ROUTE, {
      style,
      onEachFeature: (feature, layer) => {
        // Subtle hover effect
        layer.on('mouseover', function () {
          layer.setStyle(highlightStyle(feature));
        });
        layer.on('mouseout', function () {
          layer.setStyle(style(feature));
        });
        // Click: show Leaflet popup at midpoint
        layer.on('click', function (e) {
          // Remove previous popup if any
          if (popupRef.current) {
            leafletMapRef.current.closePopup(popupRef.current);
          }
          const coords = feature.geometry.coordinates;
          const midpoint = getMidpoint(coords);
          // Leaflet expects [lat, lng]
          const latlng = [midpoint[1], midpoint[0]];
          // Compose content
          const p = feature.properties;
          let html = `
            <div style="min-width:240px;max-width:320px;padding:12px 8px;border-radius:16px;background:white;color:#222;box-shadow:0 2px 18px #0002;font-family:sans-serif;">
              <div style="font-size:1.15rem;font-weight:700;margin-bottom:2px;">${p.origin} <span style='color:#3b82f6;'>→</span> ${p.destination}</div>
              <div style="font-size:1rem;color:#2563eb;font-weight:500;margin-bottom:2px;">${p.productName}</div>
              <div style="font-size:0.8rem;color:#888;margin-bottom:6px;">${p.shipmentDate} | Priority: ${p.priority}</div>
              <div style="display:flex;gap:10px;margin-bottom:6px;">
                <div style="background:#f3f4f6;padding:3px 8px;border-radius:8px;font-size:0.8rem;">ETA: <b>${p.eta}</b></div>
                <div style="background:#f3f4f6;padding:3px 8px;border-radius:8px;font-size:0.8rem;">Cost: <b>${p.cost}</b></div>
                <div style="background:#f3f4f6;padding:3px 8px;border-radius:8px;font-size:0.8rem;">Emissions: <b>${p.emissions}</b></div>
              </div>
              <div style="font-size:0.85rem;margin-bottom:4px;">Status: <span style="color:white;background:${statusColor[p.status]};border-radius:6px;padding:2px 8px;">${statusLabel[p.status]}</span></div>
              <div style="font-size:0.85rem;margin-bottom:2px;"><b>Description:</b> ${p.description}</div>
              ${p.status === 'rerouted' ? `<div style='font-size:0.8rem;margin-top:4px;background:#fef9c3;border-radius:8px;padding:5px 8px;'><b>Rerouted:</b> ${p.oldMode} → ${p.newMode} (from ${p.rerouteOrigin})</div>` : ''}
            </div>
          `;
          popupRef.current = L.popup({
            closeButton: true,
            autoPan: true,
            className: 'dashboard-popup',
            offset: [0, -8]
          })
            .setLatLng(latlng)
            .setContent(html)
            .openOn(leafletMapRef.current);
        });
      }
    });
    geojsonLayer.addTo(leafletMapRef.current);
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
