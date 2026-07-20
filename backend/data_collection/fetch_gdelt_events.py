"""
Pulls daily mention count + average tone per ticker from GDELT GKG,
via a single combined BigQuery query (not one query per ticker).
Uses the partitioned table + _PARTITIONTIME pruning to control cost.
Computes a rolling z-score on mention volume to flag candidate "event days".
"""

from google.cloud import bigquery
import pandas as pd

# ---- CONFIG ----
PROJECT_ID = "eventlens-ai"
START_DATE = "20240101000000"   # inclusive, packed GDELT format
END_DATE   = "20250101000000"   # exclusive
# Partition-time bounds: same window with 1-day buffer on each side
PARTITION_START = "2023-12-31"
PARTITION_END   = "2025-01-02"
DRY_RUN_ONLY = False
Z_SCORE_THRESHOLD = 2.0

TICKER_NAMES = {
    "AAPL": ["apple inc", "apple computer"],
    "MSFT": ["microsoft corp", "microsoft corporation"],
    "NVDA": ["nvidia corp", "nvidia corporation"],
    "AMZN": ["amazon.com", "amazon inc"],
    "TSLA": ["tesla inc", "tesla motors"],
    "WMT":  ["walmart inc", "wal-mart"],
    "JPM":  ["jpmorgan chase", "jp morgan"],
    "GS":   ["goldman sachs"],
    "PFE":  ["pfizer inc"],
    "JNJ":  ["johnson & johnson", "johnson and johnson"],
    "UNH":  ["unitedhealth group", "unitedhealth"],
    "XOM":  ["exxon mobil", "exxonmobil"],
    "CVX":  ["chevron corp", "chevron corporation"],
    "BA":   ["boeing co", "boeing company"],
    "CAT":  ["caterpillar inc"],
    "T":    ["at&t inc", "at&t corp"],
    "KO":   ["coca-cola co", "coca cola company"],
    "PG":   ["procter & gamble", "procter and gamble"],
    "DIS":  ["walt disney", "disney company"],
    "NKE":  ["nike inc"],
}


def build_case_clause(ticker_names: dict) -> str:
    lines = ["CASE"]
    for ticker, variants in ticker_names.items():
        conditions = " OR ".join(
            f"LOWER(V2Organizations) LIKE '%{name}%'" for name in variants
        )
        lines.append(f"    WHEN {conditions} THEN '{ticker}'")
    lines.append("    ELSE NULL")
    lines.append("  END")
    return "\n".join(lines)


def build_where_clause(ticker_names: dict) -> str:
    all_conditions = []
    for variants in ticker_names.values():
        for name in variants:
            all_conditions.append(f"LOWER(V2Organizations) LIKE '%{name}%'")
    return " OR ".join(all_conditions)


def build_query() -> str:
    case_clause = build_case_clause(TICKER_NAMES)
    where_clause = build_where_clause(TICKER_NAMES)

    return f"""
    SELECT
      SUBSTR(CAST(DATE AS STRING), 1, 8) AS event_date,
      {case_clause} AS ticker,
      COUNT(*) AS mention_count,
      AVG(CAST(SPLIT(V2Tone, ',')[OFFSET(0)] AS FLOAT64)) AS avg_tone
    FROM `gdelt-bq.gdeltv2.gkg_partitioned`
    WHERE _PARTITIONTIME >= TIMESTAMP("{PARTITION_START}")
      AND _PARTITIONTIME <  TIMESTAMP("{PARTITION_END}")
      AND DATE >= {START_DATE} AND DATE < {END_DATE}
      AND ({where_clause})
    GROUP BY event_date, ticker
    HAVING ticker IS NOT NULL
    ORDER BY ticker, event_date
    """


def estimate_query_cost(client: bigquery.Client, query: str):
    job_config = bigquery.QueryJobConfig(dry_run=True, use_query_cache=False)
    job = client.query(query, job_config=job_config)
    gb_processed = job.total_bytes_processed / (1024 ** 3)
    print(f"Estimated data to be processed: {gb_processed:.2f} GB")
    return gb_processed


def compute_event_days(df: pd.DataFrame, z_threshold: float) -> pd.DataFrame:
    df = df.sort_values(["ticker", "event_date"]).copy()
    df["event_date"] = pd.to_datetime(df["event_date"], format="%Y%m%d")

    results = []
    for ticker, group in df.groupby("ticker"):
        group = group.set_index("event_date")

        # Reindex to fill in missing calendar days, without blanket-filling
        # every column (which breaks on the string 'ticker' column).
        full_range = pd.date_range(group.index.min(), group.index.max(), freq="D")
        group = group.reindex(full_range)

        group["mention_count"] = group["mention_count"].fillna(0).astype(float)
        # avg_tone stays NaN on zero-mention days — 0 would misleadingly mean
        # "neutral sentiment," not "no coverage."
        group["ticker"] = ticker

        group["rolling_mean"] = group["mention_count"].rolling(30, min_periods=10).mean()
        group["rolling_std"] = group["mention_count"].rolling(30, min_periods=10).std()
        group["z_score"] = (
            (group["mention_count"] - group["rolling_mean"]) / group["rolling_std"]
        )

        group = group.reset_index().rename(columns={"index": "event_date"})
        results.append(group)

    full = pd.concat(results, ignore_index=True)
    event_days = full[full["z_score"] > z_threshold].copy()
    return full, event_days


def main():
    client = bigquery.Client(project=PROJECT_ID)
    query = build_query()

    gb_estimate = estimate_query_cost(client, query)

    if DRY_RUN_ONLY:
        print("\nDRY_RUN_ONLY is True — not running the real query.")
        print("Review the estimate above. If it looks reasonable (well under")
        print("your remaining free-tier budget), set DRY_RUN_ONLY = False and re-run.")
        return

    print("\nRunning real query...")
    df = client.query(query).to_dataframe()
    print(f"Retrieved {len(df)} rows across {df['ticker'].nunique()} tickers.")

    df.to_csv("gdelt_daily_mentions_raw.csv", index=False)
    print("Saved raw daily mentions to gdelt_daily_mentions_raw.csv")

    full, event_days = compute_event_days(df, Z_SCORE_THRESHOLD)
    full.to_csv("gdelt_daily_with_zscore.csv", index=False)
    event_days.to_csv("gdelt_event_days.csv", index=False)

    print(f"Flagged {len(event_days)} candidate event-days (z > {Z_SCORE_THRESHOLD})")
    print("Saved to gdelt_daily_with_zscore.csv and gdelt_event_days.csv")


if __name__ == "__main__":
    main()