from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow the React frontend (running on localhost:5173) to call this API
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
def get_portfolio():
    # Hardcoded for now — we'll pull this from PostgreSQL soon
    return {
        "holdings": [
            {"ticker": "TSM", "shares": 50, "value": 8500},
            {"ticker": "NVDA", "shares": 20, "value": 22000},
            {"ticker": "AAPL", "shares": 30, "value": 6300},
        ]
    }