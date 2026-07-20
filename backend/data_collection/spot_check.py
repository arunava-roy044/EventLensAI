import pandas as pd
df = pd.read_csv("training_dataset.csv")
print(df.sort_values("car_3day").head(3))   # worst outcomes
print(df.sort_values("car_3day").tail(3))   # best outcomes