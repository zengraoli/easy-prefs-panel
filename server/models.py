from sqlalchemy import Column, Integer, String, Enum as SAEnum
from database import Base
import enum


class AuthMethod(str, enum.Enum):
    password = "password"
    key = "key"


class Worker(Base):
    __tablename__ = "workers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    ip = Column(String, nullable=False)
    ssh_port = Column(Integer, default=22)
    username = Column(String, nullable=False)
    auth_method = Column(SAEnum(AuthMethod), default=AuthMethod.password)
    password = Column(String, nullable=True)
    key_path = Column(String, nullable=True)
    max_concurrency = Column(Integer, default=2)
