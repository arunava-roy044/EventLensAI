import numpy as np
import pandas as pd
import yfinance as yf



def get_historical_returns(tickers, period="6mo"):
    """
    Downloads historical daily closing prices for a list of tickers
    and returns their daily percentage returns as a DataFrame.
    """
    data = yf.download(tickers, period=period)["Close"]

    # Normalize to a DataFrame regardless of what yfinance returned
    if isinstance(data, pd.Series):
        data = data.to_frame(name=tickers[0])
    elif len(tickers) == 1 and data.shape[1] == 1:
        data.columns = [tickers[0]]

    returns = data.pct_change().dropna()
    return returns


def calculate_portfolio_metrics(tickers, weights, period="6mo"):
    """
    tickers: list of ticker strings, e.g. ["AAPL", "TSM"]
    weights: list of portfolio weights (must sum to 1), e.g. [0.6, 0.4]
    """
    returns = get_historical_returns(tickers, period=period)
    weights = np.array(weights)

    # Daily portfolio return = weighted sum of each stock's daily return
    portfolio_returns = returns.dot(weights)

    mean_daily_return = portfolio_returns.mean()
    daily_volatility = portfolio_returns.std()

    # Value at Risk (95% confidence, historical method)
    # This finds the 5th percentile worst daily return
    var_95 = np.percentile(portfolio_returns, 5)

    # Sharpe Ratio (annualized, assuming risk-free rate ~0 for simplicity)
    annualized_return = mean_daily_return * 252  # 252 trading days/year
    annualized_volatility = daily_volatility * np.sqrt(252)
    sharpe_ratio = annualized_return / annualized_volatility if annualized_volatility != 0 else 0

    return {
        "mean_daily_return": round(mean_daily_return * 100, 4),
        "daily_volatility": round(daily_volatility * 100, 4),
        "var_95_daily_pct": round(var_95 * 100, 4),
        "annualized_return_pct": round(annualized_return * 100, 2),
        "annualized_volatility_pct": round(annualized_volatility * 100, 2),
        "sharpe_ratio": round(sharpe_ratio, 3),
    }


def monte_carlo_simulation(tickers, weights, portfolio_value, days=30, simulations=1000, period="6mo"):
    """
    Simulates possible future portfolio values using historical mean/volatility.
    Returns percentile outcomes so you can show a range, not a single guess.
    """
    returns = get_historical_returns(tickers, period=period)
    weights = np.array(weights)
    portfolio_returns = returns.dot(weights)

    mean_return = portfolio_returns.mean()
    volatility = portfolio_returns.std()

    simulation_results = []
    for _ in range(simulations):
        daily_returns = np.random.normal(mean_return, volatility, days)
        cumulative_growth = np.prod(1 + daily_returns)
        simulation_results.append(portfolio_value * cumulative_growth)

    simulation_results = np.array(simulation_results)

    return {
        "starting_value": round(portfolio_value, 2),
        "days_simulated": days,
        "simulations_run": simulations,
        "worst_case_5pct": round(np.percentile(simulation_results, 5), 2),
        "median_case": round(np.percentile(simulation_results, 50), 2),
        "best_case_95pct": round(np.percentile(simulation_results, 95), 2),
    }