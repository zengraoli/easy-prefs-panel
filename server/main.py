from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import preview, workers

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Scrapling Config Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(preview.router, prefix="/api/preview", tags=["preview"])
app.include_router(workers.router, prefix="/api/workers", tags=["workers"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
