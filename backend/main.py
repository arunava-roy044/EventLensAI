import yfinance as yf
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

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
            "ticker": h.ticker,
            "shares": h.shares,
            "price": round(price, 2),
            "value": round(price * h.shares, 2),
        })

    return {"holdings": result}