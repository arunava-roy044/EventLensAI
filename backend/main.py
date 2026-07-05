import yfinance as yf
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from risk_engine import calculate_portfolio_metrics, monte_carlo_simulation
from risk_engine import calculate_portfolio_metrics, monte_carlo_simulation, calculate_correlation_matrix

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
        try:
            ticker_data = yf.Ticker(h.ticker)
            hist = ticker_data.history(period="5d")

            if hist.empty:
                result.append({
                    "id": h.id,
                    "ticker": h.ticker,
                    "shares": h.shares,
                    "price": None,
                    "value": None,
                    "change_pct": None,
                    "error": "Price temporarily unavailable",
                })
                continue

            price = hist["Close"].iloc[-1]
            prev_close = hist["Close"].iloc[-2] if len(hist) >= 2 else price
            change_pct = ((price - prev_close) / prev_close) * 100 if prev_close else 0

            result.append({
                "id": h.id,
                "ticker": h.ticker,
                "shares": h.shares,
                "price": round(price, 2),
                "value": round(price * h.shares, 2),
                "change_pct": round(change_pct, 2),
            })
        except Exception as e:
            result.append({
                "id": h.id,
                "ticker": h.ticker,
                "shares": h.shares,
                "price": None,
                "value": None,
                "change_pct": None,
                "error": str(e),
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


class HoldingUpdate(BaseModel):
    shares: int

@app.put("/portfolio/{holding_id}")
def update_holding(holding_id: int, update: HoldingUpdate, db: Session = Depends(get_db)):
    holding = db.query(Holding).filter(Holding.id == holding_id).first()
    if not holding:
        return {"error": "Holding not found"}

    holding.shares = update.shares
    db.commit()
    db.refresh(holding)

    return {"message": "Holding updated", "id": holding.id, "shares": holding.shares}


@app.get("/search")
def search_ticker(q: str):
    if not q or len(q) < 1:
        return {"results": []}

    search = yf.Search(q, max_results=6)
    results = [
        {"symbol": quote.get("symbol"), "name": quote.get("shortname") or quote.get("longname")}
        for quote in search.quotes
        if quote.get("symbol")
    ]
    return {"results": results}


@app.get("/portfolio/risk")
def get_portfolio_risk(db: Session = Depends(get_db)):
    holdings = db.query(Holding).all()

    if not holdings:
        return {"error": "No holdings in portfolio"}

    tickers = [h.ticker for h in holdings]

    # Calculate current value of each holding to determine weights
    values = []
    for h in holdings:
        ticker_data = yf.Ticker(h.ticker)
        hist = ticker_data.history(period="1d")
        if hist.empty:
            values.append(0)
        else:
            price = hist["Close"].iloc[-1]
            values.append(price * h.shares)

    total_value = sum(values)
    if total_value == 0:
        return {"error": "Could not calculate portfolio value"}

    weights = [v / total_value for v in values]

    metrics = calculate_portfolio_metrics(tickers, weights)
    simulation = monte_carlo_simulation(tickers, weights, portfolio_value=total_value)

    return {
        "portfolio_value": round(total_value, 2),
        "risk_metrics": metrics,
        "monte_carlo": simulation,
    }


@app.get("/portfolio/history/{ticker}")
def get_ticker_history(ticker: str, period: str = "6mo"):
    ticker_data = yf.Ticker(ticker.upper())
    hist = ticker_data.history(period=period)

    if hist.empty:
        return {"error": f"No historical data for '{ticker}'"}

    history = [
        {"date": str(date.date()), "close": round(row["Close"], 2)}
        for date, row in hist.iterrows()
    ]

    return {"ticker": ticker.upper(), "history": history}


@app.get("/portfolio/correlation")
def get_correlation(db: Session = Depends(get_db)):
    holdings = db.query(Holding).all()

    if len(holdings) < 2:
        return {"error": "Add at least 2 holdings to see correlation"}

    tickers = [h.ticker for h in holdings]
    matrix = calculate_correlation_matrix(tickers)

    return {"tickers": tickers, "matrix": matrix}