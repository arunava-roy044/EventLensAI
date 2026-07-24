from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.sql import func
from database import Base


class Holding(Base):
    __tablename__ = "holdings"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, index=True)
    shares = Column(Integer)


class EventRecord(Base):
    __tablename__ = "event_records"

    id = Column(Integer, primary_key=True, index=True)
    ticker = Column(String, index=True)
    sentiment_label = Column(String)
    is_earnings_related = Column(Boolean)
    predicted_car_3day = Column(Float)
    sector = Column(String)
    created_at = Column(DateTime, server_default=func.now())