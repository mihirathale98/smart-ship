import os
from dotenv import load_dotenv
from geopy.geocoders import Nominatim
from crewai import Agent, Task, Crew, Process
from crewai_tools import SerperDevTool
import re
import json


# Load environment variables
load_dotenv()

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

# Initialize the search tool
search_tool = SerperDevTool()

def plan_multimodal_route(start_location, end_location, modes, preferences, departure_time, avoid=None):
    """
    Plans a multimodal logistics route and returns it in GeoJSON format.
    """
    # Fetch coordinates
    # start_coords = get_loc_lat_long(start_location)
    # end_coords = get_loc_lat_long(end_location)


    # Construct the prompt
    prompt = (
        f"Plan an optimal logistics route from {start_location} to {end_location} considering the following:\n"
        f"- Transportation modes: {', '.join(modes)}\n"
        f"- Preferences: {', '.join(preferences)}\n"
        f"- Avoid: {', '.join(avoid) + 'due to disruption' if avoid else 'None'}\n"
        f"- Departure time: {departure_time}\n"
        f"Provide the route in GeoJSON LineString format suitable for map rendering. Do not add any comments in the geojson.\n"
    )

    # Define the AI Logistics Planner agent
    researcher = Agent(
        role="AI Logistics Planner",
        goal="Create an optimal multimodal logistics route between two points considering user preferences.",
        backstory=(
            "You are an AI agent specialized in planning efficient and personalized logistics routes. "
            "Make sure to look up any information you need to provide the best route. "
            "You have access to real-time data and can consider various transportation modes."
            "You can also take into account user preferences and any disruptions in the transportation network."
            "Your task is to create a multimodal route that is efficient and meets the user's needs."
            "Give granular latitude and longitude coordinates for the route."
            "You consider various transportation modes, user preferences, and real-time data to provide optimal routing solutions."
            "Provide the geojson in such a way that every different mode of transport is represented as a different line in the geojson."
            "Make sure to maintain the continuity of the route."
        ),
        tools=[search_tool],
        verbose=True
    )

    # Define the task for the agent
    task = Task(
        description=prompt,
        expected_output=(
            "A GeoJSON LineString feature representing the multimodal logistics route, including coordinates and any relevant properties."
            "The GeoJSON should be formatted correctly and ready for rendering on a map."
            "The GeoJSON should be in the following format:\n"
            "{\n"
            "  \"type\": \"FeatureCollection\",\n"
            "  \"features\": [\n"
            "    {\n"
            "      \"type\": \"Feature\",\n"
            "      \"geometry\": {\n"
            "        \"type\": \"LineString\",\n"
            "        \"coordinates\": [\n"
            "          [longitude1, latitude1],\n"
            "          [longitude2, latitude2],\n"
            "          ...\n"
            "        ]\n"
            "      },\n"
            "      \"properties\": {\n"
            "        \"mode\": \"transportation_mode\",\n"
            "        \"distance\": distance,\n"  
            "        \"duration\": duration\n"
            "      }\n"
            "    },\n"
            "    ...\n"
            "  ]\n" 
            "}" 
        ),
        agent=researcher
    )

    # Assemble the crew
    crew = Crew(
        agents=[researcher],
        tasks=[task],
        process=Process.sequential,
        verbose=True
    )

    # Execute the crew's task
    result = crew.kickoff()
    return result


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
