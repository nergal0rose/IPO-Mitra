from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
import sys
from database import create_db_and_tables

from routes import accounts, ipos, apply, reports, bulk_check

def get_static_dir():
    if getattr(sys, 'frozen', False):
        # Running as compiled executable
        base_dir = sys._MEIPASS
    else:
        # Running from script
        base_dir = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(base_dir, "static")

app = FastAPI(title="MeroShare API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(accounts.router, prefix="/api/accounts", tags=["accounts"])
app.include_router(ipos.router, prefix="/api/ipos", tags=["ipos"])
app.include_router(apply.router, prefix="/api/apply", tags=["apply"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
app.include_router(bulk_check.router, prefix="/api/bulk-check", tags=["bulk-check"])

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

# Mount static files for frontend
static_dir = get_static_dir()
if os.path.exists(static_dir):
    assets_dir = os.path.join(static_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.api_route("/api/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"], include_in_schema=False)
    async def api_not_found(full_path: str):
        raise HTTPException(status_code=404, detail="Not Found")

    @app.get("/{full_path:path}", include_in_schema=False)
    def serve_frontend(full_path: str, request: Request):
        # Check if the requested file exists in static_dir
        file_path = os.path.join(static_dir, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)

        # Fallback to index.html for React Router
        return FileResponse(os.path.join(static_dir, "index.html"))
