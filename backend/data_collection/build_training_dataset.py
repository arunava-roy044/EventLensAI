"""
Joins GDELT candidate event-days with price data (via yfinance) to build
the ML training dataset:
  - pre-event features: annualized volatility, momentum
  - GDELT features: avg_tone, mention_count, z_score (already in event_days.csv)
  - sector (from yfinance ticker info)
  - is_earnings_related flag (from yfinance earnings calendar)
  - target: 3-day cumulative abnormal return (CAR) following the event

No BigQuery cost -- this only uses yfinance and local CSVs.
"""

import numpy as np
import pandas as pd
import yfinance as yf

EVENT_DAYS_CSV = "gdelt_event_days.csv"
OUTPUT_CSV = "training_dataset.csv"

MARKET_TICKER = "SPY"
VOLATILITY_WINDOW = 30   # trading days, pre-event
MOMENTUM_WINDOW = 5      # trading days, pre-event
CAR_WINDOW = 3           # trading days, post-event (day 0 to day+2 inclusive)
EARNINGS_MATCH_TOLERANCE_DAYS = 1  # event within +/- N days of an earnings date counts as earnings-related

# yfinance needs a bit of buffer on both sides of the GDELT date range
PRICE_START = "2023-10-01"
PRICE_END = "2025-02-01"


def download_prices(tickers, start, end):
    """Batch-download close prices for all tickers + market benchmark."""
    all_tickers = list(tickers) + [MARKET_TICKER]
    data = yf.download(all_tickers, start=start, end=end)["Close"]
    return data


def estimate_beta(stock_returns: pd.Series, market_returns: pd.Series) -> float:
    """Single static beta via OLS over the full overlapping history."""
    joined = pd.concat([stock_returns, market_returns], axis=1).dropna()
    joined.columns = ["stock", "market"]
    if len(joined) < 30:
        return np.nan
    cov = joined["stock"].cov(joined["market"])
    var = joined["market"].var()
    return cov / var if var != 0 else np.nan


def align_to_trading_day(date, available_dates):
    """Return the first available trading day on or after `date`."""
    candidates = available_dates[available_dates >= date]
    if len(candidates) == 0:
        return None
    return candidates[0]


def get_earnings_dates(ticker, limit=40):
    """Fetch historical earnings-report dates for a ticker.
    Returns a set of date objects (tz-naive, date only)."""
    try:
        df = yf.Ticker(ticker).get_earnings_dates(limit=limit)
        if df is None or df.empty:
            return set()
        dates = pd.to_datetime(df.index).tz_localize(None)
        return set(d.date() for d in dates)
    except Exception as e:
        print(f"  Could not fetch earnings dates for {ticker}: {e}")
        return set()


def is_near_earnings(event_date, earnings_dates, tolerance_days):
    """True if event_date falls within +/- tolerance_days of any known
    earnings date for this ticker."""
    for ed in earnings_dates:
        if abs((event_date - ed).days) <= tolerance_days:
            return True
    return False


def build_dataset():
    events = pd.read_csv(EVENT_DAYS_CSV, parse_dates=["event_date"])
    tickers = sorted(events["ticker"].unique())
    print(f"Building dataset for {len(tickers)} tickers, {len(events)} candidate events...")

    prices = download_prices(tickers, PRICE_START, PRICE_END)
    returns = prices.pct_change()

    market_returns = returns[MARKET_TICKER]

    # Precompute beta, sector, and earnings dates per ticker
    betas = {}
    sectors = {}
    earnings_by_ticker = {}
    print("Fetching earnings calendars...")
    for ticker in tickers:
        if ticker not in returns.columns:
            print(f"WARNING: no price data for {ticker}, skipping")
            continue
        betas[ticker] = estimate_beta(returns[ticker], market_returns)
        try:
            sectors[ticker] = yf.Ticker(ticker).info.get("sector", "Unknown")
        except Exception:
            sectors[ticker] = "Unknown"
        earnings_by_ticker[ticker] = get_earnings_dates(ticker)

    rows = []
    skipped = 0

    for _, event in events.iterrows():
        ticker = event["ticker"]
        event_date = event["event_date"]

        if ticker not in returns.columns:
            skipped += 1
            continue

        available_dates = returns.index[returns[ticker].notna()]
        aligned_date = align_to_trading_day(event_date, available_dates)
        if aligned_date is None:
            skipped += 1
            continue

        idx = available_dates.get_loc(aligned_date)

        # Need enough history before for volatility window, and enough
        # days after for the CAR window.
        if idx < VOLATILITY_WINDOW or idx + CAR_WINDOW > len(available_dates) - 1:
            skipped += 1
            continue

        pre_window_dates = available_dates[idx - VOLATILITY_WINDOW: idx]
        pre_returns = returns[ticker].loc[pre_window_dates]
        pre_volatility = pre_returns.std() * np.sqrt(252)

        momentum_dates = available_dates[idx - MOMENTUM_WINDOW: idx]
        momentum = (1 + returns[ticker].loc[momentum_dates]).prod() - 1

        post_window_dates = available_dates[idx: idx + CAR_WINDOW]
        stock_window_returns = returns[ticker].loc[post_window_dates]
        market_window_returns = market_returns.loc[post_window_dates]

        beta = betas.get(ticker, np.nan)
        if pd.isna(beta):
            skipped += 1
            continue

        abnormal_returns = stock_window_returns - beta * market_window_returns
        car = abnormal_returns.sum()

        earnings_dates = earnings_by_ticker.get(ticker, set())
        earnings_flag = is_near_earnings(
            aligned_date.date(), earnings_dates, EARNINGS_MATCH_TOLERANCE_DAYS
        )

        rows.append({
            "ticker": ticker,
            "event_date": event_date.date(),
            "aligned_trading_date": aligned_date.date(),
            "sector": sectors.get(ticker, "Unknown"),
            "avg_tone": event["avg_tone"],
            "mention_count": event["mention_count"],
            "z_score": event["z_score"],
            "pre_event_volatility": pre_volatility,
            "pre_event_momentum": momentum,
            "beta": beta,
            "is_earnings_related": earnings_flag,
            "car_3day": car,
        })

    dataset = pd.DataFrame(rows)
    dataset.to_csv(OUTPUT_CSV, index=False)

    print(f"\nBuilt {len(dataset)} training rows ({skipped} events skipped -- "
          f"missing price history or insufficient window).")
    print(f"Saved to {OUTPUT_CSV}")

    print(f"\nEarnings-related events: {dataset['is_earnings_related'].sum()} "
          f"out of {len(dataset)} ({dataset['is_earnings_related'].mean()*100:.1f}%)")

    print("\nTarget (car_3day) summary, split by earnings flag:")
    print(dataset.groupby("is_earnings_related")["car_3day"].describe())


if __name__ == "__main__":
    build_dataset()