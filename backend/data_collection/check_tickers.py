import pandas as pd
df = pd.read_csv("gdelt_daily_mentions_raw.csv")
print(sorted(df["ticker"].unique()))