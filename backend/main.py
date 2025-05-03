from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List
from backend.agent import plan_multimodal_route

app = FastAPI()

# Allow all origins for CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RouteRequest(BaseModel):
    start: str
    end: str
    modes: List[str]
    optimizations: List[str]

@app.get("/")
def root():
    return {"message": "Welcome to the Multimodal Transport Routing API"}

@app.post("/get_route")
async def get_route(request: RouteRequest):
    # Call the multimodal route planner
    routes = plan_multimodal_route(
        start_location=request.start,
        end_location=request.end,
        modes=request.modes,
        preferences=request.optimizations,
        departure_time=None
    )
    # Always return a list of route objects
    if not isinstance(routes, list):
        routes = [routes]
    return JSONResponse(content=routes)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)