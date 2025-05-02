import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getRecommendedRoutes } from "./api/getRecommendedRoutes";

const priorityLabels = {
  "lowest-cost": "Lowest Cost",
  "fastest-delivery": "Fastest Delivery",
  "lowest-emissions": "Lowest Emissions",
};

const cityList = [
  "Atlanta",
  "Austin",
  "Baltimore",
  "Boston",
  "Charlotte",
  "Chicago",
  "Cincinnati",
  "Cleveland",
  "Columbus",
  "Dallas",
  "Denver",
  "Detroit",
  "El Paso",
  "Fort Worth",
  "Fresno",
  "Houston",
  "Indianapolis",
  "Jacksonville",
  "Kansas City",
  "Las Vegas",
  "Los Angeles",
  "Louisville",
  "Memphis",
  "Miami",
  "Milwaukee",
  "Minneapolis",
  "Nashville",
  "New Orleans",
  "New York",
  "Oakland",
  "Oklahoma City",
  "Omaha",
  "Philadelphia",
  "Phoenix",
  "Pittsburgh",
  "Portland",
  "Raleigh",
  "Sacramento",
  "San Antonio",
  "San Diego",
  "San Francisco",
  "San Jose",
  "Seattle",
  "St. Louis",
  "Tampa",
  "Tucson",
  "Virginia Beach",
  "Washington"
];

export default function Dashboard() {
  const [shipments, setShipments] = useState([]);
  const [rerouteState, setRerouteState] = useState({}); // { [shipmentId]: { step, newOrigin, routes, loading, matches, dropdown } }
  const navigate = useNavigate();
  const inputRefs = useRef({});

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    navigate("/login");
  };

  useEffect(() => {
    let stored = [];
    try {
      stored = JSON.parse(localStorage.getItem("shipments")) || [];
    } catch (e) {
      stored = [];
    }
    setShipments(stored);
  }, []);

  // Helper to update a shipment in localStorage and state
  const updateShipment = (shipmentId, updater) => {
    const updatedShipments = shipments.map((s) =>
      s.id === shipmentId ? updater(s) : s
    );
    localStorage.setItem("shipments", JSON.stringify(updatedShipments));
    setShipments(updatedShipments);
  };

  // Handle reroute button click
  const handleRerouteClick = (shipmentId) => {
    setRerouteState((prev) => ({ ...prev, [shipmentId]: { step: 1, newOrigin: '', routes: [], loading: false, matches: [], dropdown: false } }));
  };

  // Handle new origin input change with autocomplete
  const handleNewOriginChange = (shipmentId, value) => {
    const matches = value.length > 0
      ? cityList.filter((city) => city.toLowerCase().startsWith(value.toLowerCase()))
      : [];
    setRerouteState((prev) => ({
      ...prev,
      [shipmentId]: {
        ...prev[shipmentId],
        newOrigin: value,
        matches,
        dropdown: matches.length > 0
      }
    }));
  };

  // Handle selecting a city from autocomplete
  const handleOriginSelect = (shipmentId, city) => {
    setRerouteState((prev) => ({
      ...prev,
      [shipmentId]: {
        ...prev[shipmentId],
        newOrigin: city,
        matches: [],
        dropdown: false
      }
    }));
  };

  // Hide dropdown on blur (with slight delay for click)
  const handleOriginBlur = (shipmentId) => setTimeout(() => {
    setRerouteState((prev) => ({
      ...prev,
      [shipmentId]: {
        ...prev[shipmentId],
        dropdown: false
      }
    }));
  }, 100);

  // Handle confirm new origin (fetch routes)
  const handleConfirmNewOrigin = async (shipment) => {
    const { newOrigin } = rerouteState[shipment.id];
    setRerouteState((prev) => ({ ...prev, [shipment.id]: { ...prev[shipment.id], loading: true } }));
    // Call getRecommendedRoutes
    const routes = await getRecommendedRoutes({
      origin: newOrigin,
      destination: shipment.destination,
      productName: shipment.productName,
      shipmentDate: shipment.shipmentDate,
      priority: shipment.priority,
    });
    setRerouteState((prev) => ({ ...prev, [shipment.id]: { ...prev[shipment.id], routes, loading: false, step: 2 } }));
  };

  // Handle select reroute
  const handleSelectReroute = (shipment, selectedRoute) => {
    updateShipment(shipment.id, (s) => ({
      ...s,
      reroute: {
        from: rerouteState[shipment.id].newOrigin,
        selectedRoute: selectedRoute,
      },
      // Optionally set status to 'rerouted', but do NOT delete original route/disruption/status fields
      status: s.status === 'disrupted' ? 'rerouted' : s.status,
    }));
    setRerouteState((prev) => ({ ...prev, [shipment.id]: undefined }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between max-w-6xl mx-auto mb-8 gap-4">
        <h1 className="text-3xl font-bold text-center md:text-left">Shipments Dashboard</h1>
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto items-center justify-end">
          <button
            onClick={() => navigate('/create')}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-blue-700 transition w-full md:w-auto"
          >
            + New Shipment
          </button>
          <button
            onClick={handleLogout}
            className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg font-semibold shadow hover:bg-gray-300 transition w-full md:w-auto ml-0 md:ml-4 mt-2 md:mt-0"
          >
            Logout
          </button>
        </div>
      </div>
      {shipments.length === 0 ? (
        <div className="text-center text-gray-500 text-lg">No shipments yet</div>
      ) : (
        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          {shipments.map((s) => {
            const reroute = s.reroute;
            const disruption = s.disruption;
            const rerouteUI = rerouteState[s.id];
            return (
              <div
                key={s.id}
                className="bg-white rounded-lg shadow-md border border-gray-100 p-6 flex flex-col space-y-3"
              >
                <div className="text-lg font-semibold mb-1 text-blue-700">
                  {s.origin} <span className="mx-2 text-gray-400">→</span> {s.destination}
                </div>
                <div className="text-sm text-gray-700">
                  <span className="font-semibold">Product:</span> {s.productName}
                </div>
                <div className="text-sm text-gray-700">
                  <span className="font-semibold">Shipment Date:</span> {s.shipmentDate}
                </div>
                <div className="text-sm text-gray-700">
                  <span className="font-semibold">Priority:</span> {priorityLabels[s.priority] || s.priority}
                </div>
                <div className="border-t border-gray-200 my-2" />

                {/* Disruption and Reroute Display */}
                {disruption && reroute ? (
                  <>
                    <div className="mb-2">
                      <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded font-semibold">Disruption</span>
                      <span className="ml-2 text-sm text-red-700">{typeof disruption === 'object' ? disruption?.message || "N/A" : disruption || "N/A"}</span>
                    </div>
                    {s.route && (
                      <div className="mb-2">
                        <span className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded font-semibold">Original Route</span>
                        <div className="ml-2 mt-1 p-2 border border-gray-300 rounded bg-gray-50">
                          <div className="text-sm font-medium">Mode: {s.route?.mode || "N/A"}</div>
                          <div className="text-xs text-gray-600">ETA: {s.route?.estimatedTime ?? "N/A"} days</div>
                          <div className="text-xs text-gray-600">Cost: ${s.route?.estimatedCost ?? "N/A"}</div>
                          <div className="text-xs text-gray-600">Emissions: {s.route?.estimatedEmissions ?? "N/A"} kg CO₂</div>
                        </div>
                      </div>
                    )}
                    {reroute?.from && (
                      <div className="mb-2">
                        <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded font-semibold">Rerouted from {reroute?.from || "N/A"}</span>
                      </div>
                    )}
                    {reroute?.selectedRoute && (
                      <div className="mb-2">
                        <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded font-semibold">New Route</span>
                        <div className="ml-2 mt-1 p-2 border-2 border-green-400 rounded bg-green-50">
                          <div className="text-sm font-bold">Mode: {reroute?.selectedRoute?.mode || "N/A"}</div>
                          <div className="text-xs text-gray-700">ETA: {reroute?.selectedRoute?.estimatedTime ?? "N/A"} days</div>
                          <div className="text-xs text-gray-700">Cost: ${reroute?.selectedRoute?.estimatedCost ?? "N/A"}</div>
                          <div className="text-xs text-gray-700">Emissions: {reroute?.selectedRoute?.estimatedEmissions ?? "N/A"} kg CO₂</div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="text-sm text-gray-700">
                      <span className="font-semibold">Route:</span> {s.route?.mode || s.mode || "N/A"}
                    </div>
                    <div className="text-sm text-gray-700">
                      <span className="font-semibold">ETA:</span> {s.route?.estimatedTime ?? s.estimatedTime ?? "N/A"} days
                    </div>
                    <div className="text-sm text-gray-700">
                      <span className="font-semibold">Cost:</span> ${s.route?.estimatedCost ?? s.estimatedCost ?? "N/A"}
                    </div>
                    <div className="text-sm text-gray-700">
                      <span className="font-semibold">Emissions:</span> {s.route?.estimatedEmissions ?? s.estimatedEmissions ?? "N/A"} kg CO₂
                    </div>
                  </>
                )}
                <div className="border-t border-gray-200 my-2" />
                <div className={`text-sm font-bold uppercase tracking-wide ${s.status === "disrupted" ? "text-red-700" : s.status === "rerouted" ? "text-blue-700" : "text-green-700"}`}>{s.status || "En Route"}</div>
                {/* Disrupted Alert & Reroute Logic */}
                {s.status === "disrupted" && !reroute && (
                  <div className="mt-2">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-2 flex items-center justify-between">
                      <span>Shipment disrupted!</span>
                      <button
                        className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm font-semibold"
                        onClick={() => handleRerouteClick(s.id)}
                      >
                        Reroute
                      </button>
                    </div>
                    {/* Reroute Step 1: Enter new origin with autocomplete */}
                    {rerouteUI && rerouteUI.step === 1 && (
                      <div className="bg-white border border-gray-200 rounded p-4 mt-2 flex flex-col gap-2 relative">
                        <label className="text-sm font-medium mb-1">New Origin City</label>
                        <input
                          type="text"
                          value={rerouteUI.newOrigin}
                          onChange={e => handleNewOriginChange(s.id, e.target.value)}
                          onFocus={e => handleNewOriginChange(s.id, rerouteUI.newOrigin)}
                          onBlur={() => handleOriginBlur(s.id)}
                          ref={el => inputRefs.current[s.id] = el}
                          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter new origin"
                          autoComplete="off"
                        />
                        {rerouteUI.dropdown && rerouteUI.matches && rerouteUI.matches.length > 0 && (
                          <ul className="absolute z-10 left-0 right-0 bg-white border border-gray-200 rounded shadow mt-1 max-h-48 overflow-y-auto">
                            {rerouteUI.matches.map((city) => (
                              <li
                                key={city}
                                className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                                onMouseDown={() => handleOriginSelect(s.id, city)}
                              >
                                {city}
                              </li>
                            ))}
                          </ul>
                        )}
                        <button
                          className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition self-start"
                          disabled={!rerouteUI.newOrigin || rerouteUI.loading}
                          onClick={() => handleConfirmNewOrigin(s)}
                        >
                          {rerouteUI.loading ? "Loading..." : "Get New Routes"}
                        </button>
                      </div>
                    )}
                    {/* Reroute Step 2: Show route options */}
                    {rerouteUI && rerouteUI.step === 2 && (
                      <div className="bg-white border border-gray-200 rounded p-4 mt-2 flex flex-col gap-3">
                        <div className="text-sm font-semibold mb-2">Select a new route:</div>
                        {rerouteUI.routes.map((route, idx) => (
                          <div key={idx} className="flex flex-col md:flex-row md:items-center md:justify-between border border-blue-100 rounded p-3 mb-2">
                            <div>
                              <div className="font-medium">Mode: {route.mode}</div>
                              <div className="text-xs text-gray-600">ETA: {route.estimatedTime} days</div>
                              <div className="text-xs text-gray-600">Cost: ${route.estimatedCost}</div>
                              <div className="text-xs text-gray-600">Emissions: {route.estimatedEmissions} kg CO₂</div>
                            </div>
                            <button
                              className="mt-2 md:mt-0 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                              onClick={() => handleSelectReroute(s, route)}
                            >
                              Select This Route
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
