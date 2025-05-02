// Mock async function for recommended routes
export async function getRecommendedRoutes(formData) {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return [
    {
      mode: "Truck + Rail",
      estimatedTime: 5,
      estimatedCost: 1200,
      estimatedEmissions: 350,
    },
    {
      mode: "Truck Only",
      estimatedTime: 3,
      estimatedCost: 1500,
      estimatedEmissions: 500,
    },
    {
      mode: "Rail Only",
      estimatedTime: 7,
      estimatedCost: 900,
      estimatedEmissions: 200,
    },
  ];
}
