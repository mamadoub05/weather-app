from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import httpx
import csv
import json
from fastapi.responses import StreamingResponse
import io

load_dotenv()

API_KEY = os.getenv("WEATHER_API_KEY")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database setup
DATABASE_URL = "sqlite:///./weather.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# Database model
class WeatherSearch(Base):
    __tablename__ = "searches"
    id = Column(Integer, primary_key=True, index=True)
    city = Column(String)
    country = Column(String)
    temp = Column(Float)
    description = Column(String)
    humidity = Column(Integer)
    wind_speed = Column(Float)
    searched_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

# Pydantic model
class SearchCreate(BaseModel):
    city: str
    country: str
    temp: float
    description: str
    humidity: int
    wind_speed: float

# CREATE: save a search
@app.post("/searches")
def create_search(search: SearchCreate):
    db = SessionLocal()
    new_search = WeatherSearch(**search.dict())
    db.add(new_search)
    db.commit()
    db.refresh(new_search)
    db.close()
    return new_search

# READ: get all searches
@app.get("/searches")
def get_searches():
    db = SessionLocal()
    searches = db.query(WeatherSearch).all()
    db.close()
    return searches

# UPDATE: allows us to update a search
@app.put("/searches/{search_id}")
def update_search(search_id: int, search: SearchCreate):
    db = SessionLocal()
    existing = db.query(WeatherSearch).filter(WeatherSearch.id == search_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Search not found")
    for key, value in search.dict().items():
        setattr(existing, key, value)
    db.commit()
    db.refresh(existing)
    db.close()
    return existing

# DELETE: allows us to delete a search
@app.delete("/searches/{search_id}")
def delete_search(search_id: int):
    db = SessionLocal()
    existing = db.query(WeatherSearch).filter(WeatherSearch.id == search_id).first()
    if not existing:
        raise HTTPException(status_code=404, detail="Search not found")
    db.delete(existing)
    db.commit()
    db.close()
    return {"message": "Deleted successfully"}

# EXPORT into JSON
@app.get("/export/json")
def export_json():
    db = SessionLocal()
    searches = db.query(WeatherSearch).all()
    db.close()
    data = [
        {
            "id": s.id,
            "city": s.city,
            "country": s.country,
            "temp": s.temp,
            "description": s.description,
            "humidity": s.humidity,
            "wind_speed": s.wind_speed,
            "searched_at": str(s.searched_at)
        }
        for s in searches
    ]
    return StreamingResponse(
        io.BytesIO(json.dumps(data, indent=2).encode()),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=weather_searches.json"}
    )

# EXPORT into a CSV
@app.get("/export/csv")
def export_csv():
    db = SessionLocal()
    searches = db.query(WeatherSearch).all()
    db.close()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "city", "country", "temp", "description", "humidity", "wind_speed", "searched_at"])
    for s in searches:
        writer.writerow([s.id, s.city, s.country, s.temp, s.description, s.humidity, s.wind_speed, s.searched_at])
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=weather_searches.csv"}
    )