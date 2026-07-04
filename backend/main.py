import yfinance as yf
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import engine, get_db, Base
from models import Holding

Base.metadata.create_all(bind=engine)  # creates the holdings table if it doesn't exist

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "EventLens AI backend is running"}

@app.get("/portfolio")
def get_portfolio(db: Session = Depends(get_db)):
    holdings = db.query(Holding).all()
    result = []

    for h in holdings:
        ticker_data = yf.Ticker(h.ticker)
        price = ticker_data.history(period="1d")["Close"].iloc[-1]
        result.append({
            "id": h.id,
            "ticker": h.ticker,
            "shares": h.shares,
            "price": round(price, 2),
            "value": round(price * h.shares, 2),
        })

    return {"holdings": result}

class HoldingCreate(BaseModel):
    ticker: str
    shares: int

@app.post("/portfolio")
def add_holding(holding: HoldingCreate, db: Session = Depends(get_db)):
    # Validate the ticker actually exists before adding it
    ticker_data = yf.Ticker(holding.ticker.upper())
    hist = ticker_data.history(period="1d")

    if hist.empty:
        return {"error": f"'{holding.ticker}' is not a valid ticker"}

    new_holding = Holding(ticker=holding.ticker.upper(), shares=holding.shares)
    db.add(new_holding)
    db.commit()
    db.refresh(new_holding)

    return {"message": "Holding added", "ticker": new_holding.ticker, "shares": new_holding.shares}

@app.delete("/portfolio/{holding_id}")
def delete_holding(holding_id: int, db: Session = Depends(get_db)):
    holding = db.query(Holding).filter(Holding.id == holding_id).first()
    if not holding:
        return {"error": "Holding not found"}
    db.delete(holding)
    db.commit()
    return {"message": "Holding deleted"}