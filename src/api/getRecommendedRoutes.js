// Call FastAPI backend for recommended routes
export async function getRecommendedRoutes(formData) {
  // Map frontend formData to backend expected keys
  const payload = {
    start: formData.origin,
    end: formData.destination,
    modes: ["road", "rail", "air"], // TODO: allow user selection or infer from form
    optimizations: [formData.priority], // send as array
  };
  try {
    const res = await fetch("http://localhost:8000/get_route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to get route");
    const data = await res.json();
    // The backend returns a single route object; wrap in array for UI compatibility
    return [data];
  } catch (e) {
    // Fallback: return empty array or mock
    return [];
  }
}
