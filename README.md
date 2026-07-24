# EventLens AI 🚀

A full-stack portfolio risk analytics platform that helps investors understand the real risk behind their holdings — not just track prices.

## Features

- **Live Portfolio Management** — search companies by name, add/edit/delete holdings, with live market prices pulled via yfinance
- **Quantitative Risk Engine** — Value at Risk (VaR), Sharpe Ratio, and annualized volatility computed from real historical price data
- **Monte Carlo Simulation** — 1,000 simulated future outcomes showing a realistic range of portfolio results, not a single guess
- **Portfolio Allocation Chart** — visualizes what percentage of the portfolio each holding represents
- **Correlation Matrix** — a color-coded heatmap showing which holdings genuinely diversify risk vs. which move together
- **Event Impact Analysis (ML)** — a Random Forest model, trained on 258 real GDELT-derived news events, estimates the short-term abnormal return a stock might experience given a hypothetical event's sentiment and category. Predictions are shown alongside an explicit, honest disclaimer about the model's actual accuracy (see [Model Performance & Limitations](#model-performance--limitations) below) — this is a deliberate design choice, not an afterthought
- **Interactive Landing Page** — includes a live VaR calculator so visitors can grasp the concept before entering the dashboard
- **Overview Dashboard** — at-a-glance summary of total value, daily change, best/worst performers, and Sharpe ratio

## Tech Stack

**Frontend:** React, Tailwind CSS, Recharts, Axios, lucide-react
**Backend:** FastAPI, SQLAlchemy, yfinance, scikit-learn, joblib
**Database:** PostgreSQL
**ML Data Pipeline:** Google BigQuery (GDELT GKG dataset), yfinance

## Project Structure

eventlens-ai/
backend/
main.py # FastAPI app, all routes
models.py # SQLAlchemy models (Holding, EventRecord)
database.py # DB engine/session config
risk_engine.py # VaR, Sharpe, volatility, Monte Carlo, correlation
event_model.py # Loads trained ML model, exposes predict_event_impact()
requirements.txt
ml/
train_event_model.py # Cross-validated model comparison (naive/linear/RF)
save_model.py # Trains final RF on full dataset, saves .joblib
extract_feature_stats.py # One-off: derives sentiment-dropdown percentile values
event_impact_model.joblib # Trained model artifact (committed for reproducibility)
data_collection/
fetch_gdelt_events.py # Queries GDELT via BigQuery, flags candidate event-days
build_training_dataset.py # Joins events to price data, builds features + target
*.csv # Intermediate and final training data artifacts
frontend/
src/
api/
hooks/
components/
EventImpactTab.jsx # Event Impact Analysis UI
App.jsx

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\Activate.ps1   # Windows
pip install -r requirements.txt
```

Create a `.env` file in `backend/` with:

DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/eventlens

Create the database:

```bash
psql -U postgres
CREATE DATABASE eventlens;
```

Run the backend:

```bash
uvicorn main:app --reload
```

The trained ML model (`backend/ml/event_impact_model.joblib`) is already committed to the repo, so the Event Impact feature works out of the box — no need to retrain or re-run the data pipeline just to use the app.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.

### (Optional) Reproducing the ML Data Pipeline

The scripts in `backend/data_collection/` and `backend/ml/` are one-off/dev-time tools used to build the training dataset and train the model — they are **not** required to run the live app, since the trained model is already committed. If you want to reproduce or extend the pipeline (e.g., add more tickers, a longer date range), you'll additionally need:

```bash
pip install google-cloud-bigquery pandas-gbq lxml
```

You'll also need a Google Cloud project with the BigQuery API enabled and `gcloud auth application-default login` run locally, since GDELT event data is queried live from Google's public BigQuery tables. See inline comments in `fetch_gdelt_events.py` for details on cost-safe usage (dry-run cost estimation is built in).

## Model Performance & Limitations

The Event Impact model was built and evaluated with academic honesty as a priority — no claims here overstate what a 258-row dataset can support.

**What it does:** predicts the 3-day cumulative abnormal return (CAR) — the stock's return in excess of what general market movement would explain — for a hypothetical event, given its sentiment, the stock's sector, its pre-event volatility/momentum/beta, and whether it's earnings-related.

**How it was built:**
- 258 candidate "event days" identified from GDELT news data (2024) across 17 large-cap tickers, using a mention-volume spike heuristic
- Target variable is a market-adjusted abnormal return (not raw return), to isolate the event's effect from general market drift
- Extreme cases were manually verified against real news (e.g., Nike's June 2024 guidance miss, Nvidia's and Tesla's earnings reactions) — all matched genuine events

**Honest result:** a constrained Random Forest was compared against a linear regression baseline and a naive (predict-the-mean) baseline using 5-fold cross-validation. **Neither the Random Forest nor linear regression outperformed the naive baseline** — both showed negative R², and directional accuracy for all three approaches was ~50-52% (essentially coin-flip). This was confirmed to be robust by re-running the entire pipeline with a 1-day window instead of 3-day (same conclusion), and by checking that no individual feature had a meaningfully strong correlation with the outcome (max ~0.14).

**Why this is a reasonable, reportable finding, not a failure:** short-horizon abnormal stock returns are, by the efficient market hypothesis, expected to be very difficult to predict from public sentiment/volume data — if such a signal were both real and easy to exploit, it would already be priced in. A near-null result on a 258-row student dataset is consistent with, not contradictory to, how real financial markets behave. The live app surfaces this limitation directly to the user via an in-UI disclaimer, rather than presenting predictions as reliable trading signals.

## Roadmap

- Larger, multi-year training dataset (currently limited to 2024, 17 tickers)
- Rolling (rather than static) beta estimation for the abnormal-return calculation
- Feed predicted event impact into a modified Monte Carlo simulation (shift simulated returns for the event window)
- Explore NLP-based event categorization beyond the current mention-volume-spike heuristic
- Geo-Social Exposure Score (GES) and Sector Dependency Cascade Model (exploratory, not yet scoped)
- AI-powered risk copilot (Claude API integration)

## Screenshots

_(Add screenshots of your dashboard here)_

## License

This project is for educational purposes as part of a final year academic project.

