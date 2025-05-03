from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from fastapi import Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

from agent import get_route


app = FastAPI(
    title="Multimodal Transport Routing API",
    description="API for finding optimal routes using multiple transportation modes",
    version="1.0.0"
)
# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/get_route")
async def get_route(request: Request):
    """
    Endpoint to get the route based on the request data.
    """
    try:
        data = await request.json()
        start = data.get("start")
        end = data.get("end")
        optimizations = data.get("optimizations", [])
        modes = data.get("modes", [])
        route = get_route(start, end, optimizations, modes)
        return JSONResponse(content=route)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    

@app.get("/")
async def root():
    """
    Root endpoint to check if the API is running.
    """
    return {"message": "Welcome to the Multimodal Transport Routing API"}


if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000)