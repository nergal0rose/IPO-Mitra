from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import create_db_and_tables

from routes import accounts, ipos, apply, reports, bulk_check

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
