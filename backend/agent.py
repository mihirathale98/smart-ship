import os
from dotenv import load_dotenv
from geopy.geocoders import Nominatim
from crewai import Agent, Task, Crew, Process
from crewai_tools import SerperDevTool
import re
import json
import random


# Load environment variables
load_dotenv()

import os
print("OPENAI_API_KEY:", os.getenv("OPENAI_API_KEY"))

# Initialize geolocator
geolocator = Nominatim(user_agent="logistics_planner")

def get_loc_lat_long(location_name):
    """
    Retrieves the latitude and longitude for a given location name.
    """
    location = geolocator.geocode(location_name)
    if location:
        return location.latitude, location.longitude
    else:
        return None

def build_route_response(geojson, mode, estimated_time, cost, emissions, distance, steps=None):
    """
    Build a clean, parseable route response for the frontend dashboard UI.
    """
    # Option A: Top-level keys
    response = {
        "geojson": geojson,
        "mode": mode,
        "estimatedTime": estimated_time,
        "cost": cost,
        "emissions": emissions,
        "distance": distance,
        "steps": steps or []
    }
    # Option B: Embed metadata in GeoJSON Feature properties (for mapping libs)
    # Uncomment if needed by frontend:
    # if isinstance(geojson, dict) and geojson.get("type") == "Feature":
    #     geojson["properties"] = {
    #         "mode": mode,
    #         "estimatedTime": estimated_time,
    #         "cost": cost,
    #         "emissions": emissions,
    #         "distance": distance,
    #         "steps": steps or []
    #     }
    #     response = geojson
    return response

def example_usage():
    # Example data
    geojson = {
        "type": "Feature",
        "geometry": {
            "type": "LineString",
            "coordinates": [[-74, 40.7], [-118.2, 34.05]]
        },
        "properties": {}
    }
    return build_route_response(
        geojson=geojson,
        mode=["truck", "rail"],
        estimated_time=5,
        cost=1200.0,
        emissions=320.5,
        distance=4500,
        steps=["New York", "Chicago", "Los Angeles"]
    )

def plan_multimodal_route(start_location, end_location, modes, preferences, departure_time, avoid=None):
    """
    Plans multiple multimodal logistics route options and returns them as a list of clean JSON route objects.
    """
    # For demo: generate 2-3 plausible route options with different modes/metrics
    # In production, replace this with real CrewAI/LLM logic
    city_steps = [
        [start_location, "Cleveland", end_location],
        [start_location, "Pittsburgh", "Columbus", end_location],
        [start_location, "Indianapolis", end_location]
    ]
    all_modes = [
        ["road", "rail"],
        ["road", "air"],
        ["road"]
    ]
    base_coords = {
        "Boston": [-71.0589, 42.3601],
        "Chicago": [-87.6298, 41.8781],
        "Cleveland": [-81.6944, 41.4993],
        "Pittsburgh": [-79.9959, 40.4406],
        "Columbus": [-82.9988, 39.9612],
        "Indianapolis": [-86.1581, 39.7684]
    }
    def city_to_coords(city):
        # fallback: geocode
        if city in base_coords:
            return base_coords[city]
        ll = get_loc_lat_long(city)
        if ll:
            return [ll[1], ll[0]]
        return [0,0]
    n_routes = random.randint(2,3)
    options = []
    for i in range(n_routes):
        steps = city_steps[i % len(city_steps)]
        coords = [city_to_coords(city) for city in steps]
        mode = all_modes[i % len(all_modes)]
        geojson = {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": coords
            },
            "properties": {"mode": mode}
        }
        estimated_time = random.randint(3, 7)
        cost = random.randint(900, 2000)
        emissions = random.randint(200, 600)
        distance = random.randint(900, 1600)
        options.append(build_route_response(
            geojson=geojson,
            mode=mode,
            estimated_time=estimated_time,
            cost=cost,
            emissions=emissions,
            distance=distance,
            steps=steps
        ))
    return options


if __name__ == "__main__":
    start = "Boston, MA"
    end = "Chicago, IL"
    modes = ["road", "rail", "air", "sea"]
    preferences = ["minimize cost", "avoid toll roads"]
    # avoid = ["construction", "traffic jams"]
    departure = "2025-05-03T09:00:00Z"

    route_geojson = plan_multimodal_route(start, end, modes, preferences, departure)
    print("\nGenerated Multimodal Route GeoJSON:\n")
    print(route_geojson)