import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const statusColor = {
  "en-route": "bg-green-500 text-white",
  "rerouted": "bg-yellow-400 text-gray-900",
  "delivered": "bg-gray-400 text-white",
  "disrupted": "bg-red-500 text-white"
};
const statusLabel = {
  "en-route": "En Route",
  "rerouted": "Rerouted",
  "delivered": "Delivered",
  "disrupted": "Disrupted"
};

export default function Dashboard() {
  const [shipments, setShipments] = useState([]);
  const [rerouteId, setRerouteId] = useState(null);
  const [newOrigin, setNewOrigin] = useState("");
  const [rerouteLoading, setRerouteLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    function loadShipments() {
      let stored = [];
      try {
        stored = JSON.parse(localStorage.getItem("shipments")) || [];
      } catch (e) {
        stored = [];
      }
      setShipments(stored);
    }
    loadShipments();
    window.addEventListener("storage", loadShipments);
    return () => window.removeEventListener("storage", loadShipments);
  }, []);

  const handleReroute = async (shipment) => {
    if (!newOrigin || rerouteLoading) return;
    setRerouteLoading(true);
    try {
      const payload = {
        start: newOrigin,
        end: shipment.destination,
        modes: ["road", "rail", "air"],
        optimizations: [shipment.priority]
      };
      const res = await fetch("http://localhost:8000/get_route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to reroute");
      const data = await res.json();
      let updated = shipments.map((s) => {
        if (s.id === shipment.id) {
          return {
            ...s,
            status: "rerouted",
            reroute: {
              from: newOrigin,
              selectedRoute: {
                mode: data.mode,
                estimatedTime: data.estimatedTime,
                cost: data.cost,
                emissions: data.emissions,
                geojson: data.geojson || null
              }
            }
          };
        }
        return s;
      });
      localStorage.setItem("shipments", JSON.stringify(updated));
      setShipments(updated);
      setRerouteId(null);
      setNewOrigin("");
    } catch (e) {
      alert("Failed to reroute: " + e.message);
    } finally {
      setRerouteLoading(false);
    }
  };

  const activeShipments = shipments.filter(s => ["en-route", "rerouted", "disrupted"].includes(s.status));
  const completedShipments = shipments.filter(s => ["delivered"].includes(s.status));

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}
      <header className="w-full flex justify-between items-center px-8 py-5 bg-gray-900 text-white shadow-md border-b border-gray-800 fixed top-0 left-0 z-40">
        <div className="text-4xl font-extrabold tracking-widest select-none font-sans" style={{letterSpacing: '0.14em', fontFamily: 'Montserrat, sans-serif'}}>Tavi</div>
        <div className="flex items-center gap-4">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-lg shadow transition text-base"
            onClick={() => navigate("/create")}
          >
            + New Shipment
          </button>
          <button
            className="bg-gray-700 hover:bg-gray-800 text-white font-semibold px-5 py-2 rounded-lg shadow transition text-base border border-gray-800"
            onClick={() => navigate("/geomap")}
          >
            View in Map
          </button>
          <button
            className="bg-gray-700 hover:bg-gray-800 text-white font-semibold px-5 py-2 rounded-lg shadow transition text-base border border-gray-800"
            onClick={() => {
              localStorage.removeItem("isLoggedIn");
              navigate("/login");
            }}
          >
            Logout
          </button>
        </div>
      </header>
      <div className="h-24 flex-shrink-0" />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 md:px-8 py-8">
        {/* Active Shipments */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-2 tracking-tight">Active Shipments</h2>
          {activeShipments.length === 0 ? (
            <div className="text-gray-400 text-lg py-8">No active shipments.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeShipments.map((shipment, idx) => {
                const statusClass = statusColor[shipment.status] || "bg-blue-500 text-white";
                return (
                  <div
                    key={idx}
                    className={
                      `bg-white rounded-2xl shadow-lg px-6 py-5 flex flex-col space-y-3 border border-gray-100 transition-transform duration-200 hover:scale-[1.015] hover:shadow-2xl cursor-pointer group mb-4`
                    }
                  >
                    {/* Title Row */}
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-lg text-gray-900">
                        {shipment.origin} <span className="mx-2 text-blue-500">→</span> {shipment.destination}
                      </div>
                      <span className={`ml-3 px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}>{statusLabel[shipment.status] || shipment.status}</span>
                    </div>
                    {/* Product Name & Date */}
                    <div className="text-gray-700 text-sm font-medium">{shipment.productName}</div>
                    <div className="flex items-center text-xs text-gray-500">
                      <span>{shipment.shipmentDate}</span>
                      <span className="mx-2">|</span>
                      <span>Priority: {shipment.priority}</span>
                    </div>
                    {/* Details Row */}
                    <div className="grid grid-cols-3 gap-2 text-sm mt-2">
                      <div className="bg-gray-100 rounded p-2 flex flex-col items-center">
                        <span className="font-semibold text-gray-700">ETA</span>
                        <span className="text-gray-600">{shipment.selectedRoute?.estimatedTime || shipment.eta || '--'}</span>
                      </div>
                      <div className="bg-gray-100 rounded p-2 flex flex-col items-center">
                        <span className="font-semibold text-gray-700">Cost</span>
                        <span className="text-gray-600">{shipment.selectedRoute?.cost || shipment.cost || '--'}</span>
                      </div>
                      <div className="bg-gray-100 rounded p-2 flex flex-col items-center">
                        <span className="font-semibold text-gray-700">Emissions</span>
                        <span className="text-gray-600">{shipment.selectedRoute?.emissions || shipment.emissions || '--'}</span>
                      </div>
                    </div>
                    {/* Reroute Section */}
                    {shipment.status === "disrupted" && rerouteId !== shipment.id && (
                      <button
                        className="mt-3 bg-yellow-400 text-gray-900 px-4 py-2 rounded font-semibold hover:bg-yellow-300 transition"
                        onClick={() => {
                          setRerouteId(shipment.id);
                          setNewOrigin("");
                        }}
                      >
                        Reroute
                      </button>
                    )}
                    {shipment.status === "disrupted" && rerouteId === shipment.id && (
                      <div className="mt-3 flex flex-col items-start space-y-2">
                        <input
                          type="text"
                          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter new origin city"
                          value={newOrigin}
                          onChange={e => setNewOrigin(e.target.value)}
                        />
                        <button
                          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition font-semibold"
                          onClick={() => handleReroute(shipment)}
                          disabled={rerouteLoading || !newOrigin}
                        >
                          {rerouteLoading ? "Rerouting..." : "Confirm Reroute"}
                        </button>
                        <button
                          className="ml-2 text-gray-500 hover:text-gray-700 text-xs underline"
                          onClick={() => setRerouteId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    {shipment.reroute && (
                      <div className="mt-3 p-3 rounded-xl bg-yellow-50 border border-yellow-200">
                        <div className="font-semibold text-yellow-700 mb-1">Rerouted</div>
                        <div className="text-xs text-gray-700">Old: {shipment.route?.mode || 'N/A'}</div>
                        <div className="text-xs text-gray-700">New: {shipment.reroute.selectedRoute?.mode || 'N/A'}</div>
                        <div className="text-xs text-gray-700">Rerouted from: {shipment.reroute.from || shipment.origin}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
        {/* Completed Shipments */}
        {completedShipments.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">Completed Shipments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedShipments.map((shipment, idx) => {
                const statusClass = statusColor[shipment.status] || "bg-blue-500 text-white";
                return (
                  <div
                    key={idx}
                    className={
                      `bg-white rounded-2xl shadow-lg px-6 py-5 flex flex-col space-y-3 border border-gray-100 transition-transform duration-200 hover:scale-[1.015] hover:shadow-2xl cursor-pointer group mb-4`
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-lg text-gray-900">
                        {shipment.origin} <span className="mx-2 text-blue-500">→</span> {shipment.destination}
                      </div>
                      <span className={`ml-3 px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}>{statusLabel[shipment.status] || shipment.status}</span>
                    </div>
                    <div className="text-gray-700 text-sm font-medium">{shipment.productName}</div>
                    <div className="flex items-center text-xs text-gray-500">
                      <span>{shipment.shipmentDate}</span>
                      <span className="mx-2">|</span>
                      <span>Priority: {shipment.priority}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm mt-2">
                      <div className="bg-gray-100 rounded p-2 flex flex-col items-center">
                        <span className="font-semibold text-gray-700">ETA</span>
                        <span className="text-gray-600">{shipment.selectedRoute?.estimatedTime || shipment.eta || '--'}</span>
                      </div>
                      <div className="bg-gray-100 rounded p-2 flex flex-col items-center">
                        <span className="font-semibold text-gray-700">Cost</span>
                        <span className="text-gray-600">{shipment.selectedRoute?.cost || shipment.cost || '--'}</span>
                      </div>
                      <div className="bg-gray-100 rounded p-2 flex flex-col items-center">
                        <span className="font-semibold text-gray-700">Emissions</span>
                        <span className="text-gray-600">{shipment.selectedRoute?.emissions || shipment.emissions || '--'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
