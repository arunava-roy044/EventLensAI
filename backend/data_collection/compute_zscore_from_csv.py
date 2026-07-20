import pandas as pd

Z_SCORE_THRESHOLD = 2.0


def compute_event_days(df: pd.DataFrame, z_threshold: float):
    df = df.sort_values(["ticker", "event_date"]).copy()
    df["event_date"] = pd.to_datetime(df["event_date"], format="%Y%m%d")

    results = []
    for ticker, group in df.groupby("ticker"):
        group = group.set_index("event_date")

        full_range = pd.date_range(group.index.min(), group.index.max(), freq="D")
        group = group.reindex(full_range)

        group["mention_count"] = group["mention_count"].fillna(0).astype(float)
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
    df = pd.read_csv("gdelt_daily_mentions_raw.csv")
    full, event_days = compute_event_days(df, Z_SCORE_THRESHOLD)

    full.to_csv("gdelt_daily_with_zscore.csv", index=False)
    event_days.to_csv("gdelt_event_days.csv", index=False)

    print(f"Total daily rows: {len(full)}")
    print(f"Flagged {len(event_days)} candidate event-days (z > {Z_SCORE_THRESHOLD})")
    print("\nEvent-days per ticker:")
    print(event_days["ticker"].value_counts())


if __name__ == "__main__":
    main()