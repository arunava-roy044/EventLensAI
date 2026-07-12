# EventLens AI 🚀

A full-stack portfolio risk analytics platform that helps investors understand the real risk behind their holdings — not just track prices.

## Features

- **Live Portfolio Management** — search companies by name, add/edit/delete holdings, with live market prices pulled via yfinance
- **Quantitative Risk Engine** — Value at Risk (VaR), Sharpe Ratio, and annualized volatility computed from real historical price data
- **Monte Carlo Simulation** — 1,000 simulated future outcomes showing a realistic range of portfolio results, not a single guess
- **Portfolio Allocation Chart** — visualizes what percentage of the portfolio each holding represents
- **Correlation Matrix** — a color-coded heatmap showing which holdings genuinely diversify risk vs. which move together
- **Interactive Landing Page** — includes a live VaR calculator so visitors can grasp the concept before entering the dashboard
- **Overview Dashboard** — at-a-glance summary of total value, daily change, best/worst performers, and Sharpe ratio

## Tech Stack

**Frontend:** React, Tailwind CSS, Recharts, Axios, lucide-react
**Backend:** FastAPI, SQLAlchemy, yfinance
**Database:** PostgreSQL

## Project Structure

eventlens-ai/
backend/
main.py
models.py
database.py
risk_engine.py
requirements.txt
frontend/
src/
api/
hooks/
components/
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

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.

## Roadmap

- Event-driven risk layer using geopolitical and news data (GDELT, NewsAPI)
- Geo-Social Exposure Score (GES)
- Event Similarity Matching
- Sector Dependency Cascade Model
- AI-powered risk copilot (Claude API integration)

## Screenshots

_(Add screenshots of your dashboard here)_

## License

This project is for educational purposes as part of a final year academic project.
