import pandas as pd

df = pd.read_csv("training_dataset.csv")

numeric_cols = ["avg_tone", "mention_count", "z_score",
                "pre_event_volatility", "pre_event_momentum", "beta"]

correlations = df[numeric_cols + ["car_3day"]].corr()["car_3day"].sort_values()
print(correlations)