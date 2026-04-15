from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from models import Worker
from services.remote import test_connection, deploy_and_run, get_system_stats

router = APIRouter()


class WorkerCreate(BaseModel):
    name: str
    ip: str
    ssh_port: int = 22
    username: str
    auth_method: str = "password"
    password: Optional[str] = None
    key_path: Optional[str] = None
    max_concurrency: int = 2


class WorkerUpdate(WorkerCreate):
    pass


class DeployRequest(BaseModel):
    script: str


@router.get("")
def list_workers(db: Session = Depends(get_db)):
    """Return workers from DB without SSH probing (fast)."""
    workers = db.query(Worker).all()
    return [
        {
            "id": w.id,
            "name": w.name,
            "ip": w.ip,
            "ssh_port": w.ssh_port,
            "username": w.username,
            "auth_method": w.auth_method,
            "max_concurrency": w.max_concurrency,
            "online": None,
            "cpu_percent": 0,
            "mem_percent": 0,
        }
        for w in workers
    ]


@router.get("/{worker_id}/status")
def worker_status(worker_id: int, db: Session = Depends(get_db)):
    """Fetch live system stats via SSH for a single worker."""
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    stats = get_system_stats(worker.ip, worker.ssh_port, worker.username, worker.auth_method, worker.password, worker.key_path)
    return {"id": worker.id, **stats}


@router.post("")
def create_worker(data: WorkerCreate, db: Session = Depends(get_db)):
    worker = Worker(**data.model_dump())
    db.add(worker)
    db.commit()
    db.refresh(worker)
    return {"id": worker.id, "name": worker.name}


@router.put("/{worker_id}")
def update_worker(worker_id: int, data: WorkerUpdate, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    for k, v in data.model_dump().items():
        setattr(worker, k, v)
    db.commit()
    return {"success": True}


@router.delete("/{worker_id}")
def delete_worker(worker_id: int, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    db.delete(worker)
    db.commit()
    return {"success": True}


@router.post("/{worker_id}/test")
def test_worker(worker_id: int, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    result = test_connection(worker.ip, worker.ssh_port, worker.username, worker.auth_method, worker.password, worker.key_path)
    return result


@router.post("/{worker_id}/deploy")
def deploy_to_worker(worker_id: int, req: DeployRequest, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    result = deploy_and_run(worker.ip, worker.ssh_port, worker.username, worker.auth_method, req.script, worker.password, worker.key_path)
    return result
