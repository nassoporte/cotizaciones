import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

load_dotenv() # Carga las variables de entorno desde .env

# Lee la URL de la base de datos desde las variables de entorno
# Si no se encuentra, usa SQLite como fallback para desarrollo local
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./cotizaciones.db")

# Lógica para determinar si estamos usando SQLite
is_sqlite = SQLALCHEMY_DATABASE_URL.startswith("sqlite")

# Proporciona connect_args solo si es SQLite
engine_args = {"connect_args": {"check_same_thread": False}} if is_sqlite else {}

engine = create_engine(SQLALCHEMY_DATABASE_URL, **engine_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()
