"""
Loads the trained event-impact model once at import time and exposes a
predict_event_impact() function for the FastAPI route to call.

The model is a scikit-learn Pipeline (ColumnTransformer + Random Forest)
trained on 258 GDELT-derived event-days predicting 3-day cumulative
abnormal return (CAR).

HONEST CAVEAT: cross-validated R² is near-zero (negative), and directional
accuracy is ~50% (coin-flip range).  The model does NOT produce reliable
predictions — this is a legitimate finding consistent with market
efficiency at this sample size.  Predictions should be presented with
this context, never as actionable trading signals.
"""

import os
import joblib
import numpy as np
import pandas as pd
import yfinance as yf

from risk_engine import get_historical_returns

# ---------------------------------------------------------------------------
# Load the trained pipeline ONCE at module level (not per-request).
# ---------------------------------------------------------------------------
_MODEL_PATH = os.path.join(os.path.dirname(__file__), "ml", "event_impact_model.joblib")
_pipeline = joblib.load(_MODEL_PATH)

# ---------------------------------------------------------------------------
# Training-data-derived constants for the sentiment dropdown mapping.
# Extracted from training_dataset.csv via ml/extract_feature_stats.py.
# ---------------------------------------------------------------------------
_TONE_MAP = {
    "very_negative": -1.906827,   # 10th percentile of avg_tone
    "negative":      -0.282062,   # 30th percentile
    "neutral":        0.445813,   # 50th percentile (median)
    "positive":       1.057106,   # 70th percentile
    "very_positive":  2.402044,   # 90th percentile
}

_MEDIAN_MENTION_COUNT = 69.0
_MEDIAN_Z_SCORE = 2.852524
_MEDIAN_PRE_EVENT_MOMENTUM = 0.002206

_VALID_SENTIMENTS = set(_TONE_MAP.keys())


def _compute_live_volatility(ticker, period="6mo"):
    """
    30-trading-day annualized volatility for a single ticker,
    computed from the risk engine's own historical-returns logic.
    """
    returns = get_historical_returns([ticker], period=period)
    # Use last 30 trading days available
    recent = returns.iloc[-30:] if len(returns) >= 30 else returns
    daily_std = recent.iloc[:, 0].std()
    annualized = daily_std * np.sqrt(252)
    return float(annualized)


def _compute_live_beta(ticker, period="6mo"):
    """
    OLS beta of the ticker vs SPY, computed from the same historical
    returns the risk engine uses.
    """
    returns = get_historical_returns([ticker, "SPY"], period=period)
    if "SPY" not in returns.columns or ticker not in returns.columns:
        return 1.0  # fallback
    cov = returns[[ticker, "SPY"]].dropna().cov()
    var_spy = cov.loc["SPY", "SPY"]
    if var_spy == 0:
        return 1.0
    beta = cov.loc[ticker, "SPY"] / var_spy
    return float(beta)


def _get_sector(ticker):
    """Resolve sector string via yfinance. Falls back to 'Unknown'."""
    try:
        info = yf.Ticker(ticker).info
        return info.get("sector", "Unknown")
    except Exception:
        return "Unknown"


def predict_event_impact(ticker, sentiment_label, is_earnings_related=False):
    """
    Predict the 3-day cumulative abnormal return (CAR) for a hypothetical
    event affecting the given ticker.

    Parameters
    ----------
    ticker : str
        Stock ticker symbol (e.g. "AAPL").
    sentiment_label : str
        One of: "very_negative", "negative", "neutral", "positive",
        "very_positive".  Mapped to real avg_tone percentile values
        from the training data.
    is_earnings_related : bool
        Whether the event is earnings-related.

    Returns
    -------
    dict with keys:
        predicted_car_3day : float  — the model's prediction (%)
        inputs_used        : dict   — the full feature vector for transparency
        sector             : str    — resolved ticker sector
        disclaimer         : str    — honest model-limitation note
    """
    ticker = ticker.upper()

    if sentiment_label not in _VALID_SENTIMENTS:
        raise ValueError(
            f"sentiment_label must be one of {sorted(_VALID_SENTIMENTS)}, "
            f"got '{sentiment_label}'"
        )

    # Map sentiment dropdown → real avg_tone value
    avg_tone = _TONE_MAP[sentiment_label]

    # Compute live features via risk_engine
    pre_event_volatility = _compute_live_volatility(ticker)
    beta = _compute_live_beta(ticker)

    # Resolve sector
    sector = _get_sector(ticker)

    # Build single-row DataFrame matching the pipeline's expected columns
    # (must match the column order used in save_model.py / train_event_model.py)
    row = pd.DataFrame([{
        "avg_tone": avg_tone,
        "mention_count": _MEDIAN_MENTION_COUNT,
        "z_score": _MEDIAN_Z_SCORE,
        "pre_event_volatility": pre_event_volatility,
        "pre_event_momentum": _MEDIAN_PRE_EVENT_MOMENTUM,
        "beta": beta,
        "is_earnings_related": int(is_earnings_related),
        "sector": sector,
    }])

    predicted_car = float(_pipeline.predict(row)[0])

    return {
        "predicted_car_3day": round(predicted_car * 100, 4),  # as percentage
        "inputs_used": {
            "avg_tone": round(avg_tone, 4),
            "mention_count": _MEDIAN_MENTION_COUNT,
            "z_score": round(_MEDIAN_Z_SCORE, 4),
            "pre_event_volatility": round(pre_event_volatility, 4),
            "pre_event_momentum": round(_MEDIAN_PRE_EVENT_MOMENTUM, 4),
            "beta": round(beta, 4),
            "is_earnings_related": is_earnings_related,
            "sector": sector,
        },
        "sector": sector,
        "disclaimer": (
            "This prediction is generated by a constrained Random Forest model "
            "trained on 258 GDELT-derived event-days. Cross-validated R² is "
            "near-zero and directional accuracy is ~50% (no better than chance). "
            "This is consistent with market efficiency — public sentiment/volume "
            "data does not reliably predict short-horizon abnormal returns at this "
            "sample size. Treat as an exploratory estimate, not an actionable signal."
        ),
    }
