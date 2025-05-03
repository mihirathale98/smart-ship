import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getRecommendedRoutes } from "./api/getRecommendedRoutes";

const priorities = [
  { label: "Lowest Cost", value: "lowest-cost" },
  { label: "Fastest Delivery", value: "fastest-delivery" },
  { label: "Lowest Emissions", value: "lowest-emissions" },
];

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

const productOptions = [
  "Electronics",
  "Furniture",
  "Medical Supplies",
  "Apparel",
  "Other",
];

const TEST_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        description:
          "Optimized route from Boston to Chicago avoiding tolls and prioritizing scenic views."
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

export default function CreateShipmentForm() {
  // Form state
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [productName, setProductName] = useState("");
  const [shipmentDate, setShipmentDate] = useState("");
  const [priority, setPriority] = useState(priorities[0].value);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Autocomplete state
  const [originDropdown, setOriginDropdown] = useState(false);
  const [destinationDropdown, setDestinationDropdown] = useState(false);
  const [originMatches, setOriginMatches] = useState([]);
  const [destinationMatches, setDestinationMatches] = useState([]);

  const originRef = useRef();
  const destinationRef = useRef();

  const navigate = useNavigate();

  useEffect(() => {
    // Only add if not already present
    let shipments = JSON.parse(localStorage.getItem("shipments")) || [];
    const exists = shipments.some(
      (s) => s.productName === "Test GeoJSON Route" && s.origin === "Boston" && s.destination === "Chicago"
    );
    if (!exists) {
      shipments.push({
        id: Date.now(),
        origin: "Boston",
        destination: "Chicago",
        productName: "Test GeoJSON Route",
        shipmentDate: "2025-05-02",
        priority: "fastest-delivery",
        status: "en-route",
        selectedRoute: {
          mode: "Custom",
          estimatedTime: 3,
          cost: 1500,
          emissions: 400,
          geojson: TEST_GEOJSON
        }
      });
      localStorage.setItem("shipments", JSON.stringify(shipments));
    }
  }, []);

  // Autocomplete handlers
  const handleOriginChange = (e) => {
    const value = e.target.value;
    setOrigin(value);
    if (value.length > 0) {
      const matches = cityList.filter((city) =>
        city.toLowerCase().startsWith(value.toLowerCase())
      );
      setOriginMatches(matches);
      setOriginDropdown(matches.length > 0);
    } else {
      setOriginDropdown(false);
    }
  };

  const handleDestinationChange = (e) => {
    const value = e.target.value;
    setDestination(value);
    if (value.length > 0) {
      const matches = cityList.filter((city) =>
        city.toLowerCase().startsWith(value.toLowerCase())
      );
      setDestinationMatches(matches);
      setDestinationDropdown(matches.length > 0);
    } else {
      setDestinationDropdown(false);
    }
  };

  const handleOriginSelect = (city) => {
    setOrigin(city);
    setOriginDropdown(false);
  };

  const handleDestinationSelect = (city) => {
    setDestination(city);
    setDestinationDropdown(false);
  };

  // Hide dropdowns on blur (with slight delay for click)
  const handleOriginBlur = () => setTimeout(() => setOriginDropdown(false), 100);
  const handleDestinationBlur = () => setTimeout(() => setDestinationDropdown(false), 100);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = { origin, destination, productName, shipmentDate, priority };
    setLoading(true);
    const recommendedRoutes = await getRecommendedRoutes(formData);
    setRoutes(recommendedRoutes);
    setLoading(false);
  };

  // Handle selecting a route
  const handleSelectRoute = (route) => {
    const shipment = {
      id: Date.now(),
      origin,
      destination,
      productName,
      shipmentDate,
      priority,
      route: { ...route },
      selectedRoute: {
        mode: route.mode,
        estimatedTime: route.estimatedTime,
        cost: route.estimatedCost,
        emissions: route.estimatedEmissions,
        geojson: route.geojson || null
      },
      status: "en-route",
    };
    // Save to localStorage (append, don't overwrite)
    let shipments = JSON.parse(localStorage.getItem("shipments")) || [];
    shipments.push(shipment);
    localStorage.setItem("shipments", JSON.stringify(shipments));
    // Navigate
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md space-y-6"
        autoComplete="off"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Create Shipment</h2>

        {/* Origin Autocomplete */}
        <div className="relative">
          <label className="block text-sm font-medium mb-1">Origin</label>
          <input
            type="text"
            placeholder="Enter origin city"
            value={origin}
            onChange={handleOriginChange}
            onFocus={handleOriginChange}
            onBlur={handleOriginBlur}
            ref={originRef}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            autoComplete="off"
          />
          {originDropdown && (
            <ul className="absolute z-10 left-0 right-0 bg-white border border-gray-200 rounded shadow mt-1 max-h-48 overflow-y-auto">
              {originMatches.map((city) => (
                <li
                  key={city}
                  className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                  onMouseDown={() => handleOriginSelect(city)}
                >
                  {city}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Destination Autocomplete */}
        <div className="relative">
          <label className="block text-sm font-medium mb-1">Destination</label>
          <input
            type="text"
            placeholder="Enter destination city"
            value={destination}
            onChange={handleDestinationChange}
            onFocus={handleDestinationChange}
            onBlur={handleDestinationBlur}
            ref={destinationRef}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            autoComplete="off"
          />
          {destinationDropdown && (
            <ul className="absolute z-10 left-0 right-0 bg-white border border-gray-200 rounded shadow mt-1 max-h-48 overflow-y-auto">
              {destinationMatches.map((city) => (
                <li
                  key={city}
                  className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                  onMouseDown={() => handleDestinationSelect(city)}
                >
                  {city}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Product Name Select */}
        <div>
          <label className="block text-sm font-medium mb-1">Product Name</label>
          <select
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            required
          >
            <option value="" disabled>Select a product</option>
            {productOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Shipment Date</label>
          <input
            type="date"
            value={shipmentDate}
            onChange={(e) => setShipmentDate(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Priority</label>
          <div className="flex space-x-4">
            {priorities.map((p) => (
              <label key={p.value} className="flex items-center space-x-1">
                <input
                  type="radio"
                  name="priority"
                  value={p.value}
                  checked={priority === p.value}
                  onChange={() => setPriority(p.value)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">{p.label}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? "Loading..." : "Submit"}
        </button>
      </form>

      {/* Display recommended routes */}
      {routes.length > 0 && (
        <div className="mt-10 w-full max-w-2xl flex flex-col items-center space-y-6">
          <h3 className="text-xl font-semibold mb-2">Recommended Routes</h3>
          {routes.map((route, idx) => (
            <div
              key={idx}
              className="bg-white shadow-md rounded-lg p-6 w-full max-w-lg flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-6 border border-gray-100"
            >
              <div className="flex-1">
                <div className="text-lg font-medium mb-2">Mode: {route.mode}</div>
                <div className="text-sm text-gray-600 mb-1">Estimated Time: <span className="font-semibold">{route.estimatedTime} days</span></div>
                <div className="text-sm text-gray-600 mb-1">Estimated Cost: <span className="font-semibold">${route.estimatedCost}</span></div>
                <div className="text-sm text-gray-600">Estimated Emissions: <span className="font-semibold">{route.estimatedEmissions} kg CO₂</span></div>
              </div>
              <button
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition w-full md:w-auto"
                type="button"
                onClick={() => handleSelectRoute(route)}
              >
                Select This Route
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
