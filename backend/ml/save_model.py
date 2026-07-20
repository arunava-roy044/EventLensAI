"""
Trains the final event-impact model on the FULL training dataset (not
cross-validation splits -- CV was for honest performance measurement;
this is the model that actually gets deployed) and saves it to disk.

Run this once after the dataset is finalized. Re-run only if the
training data changes (more tickers, more events, etc).
"""

import joblib
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

INPUT_CSV = "../data_collection/training_dataset.csv"
MODEL_OUTPUT_PATH = "event_impact_model.joblib"
RANDOM_STATE = 42

NUMERIC_FEATURES = [
    "avg_tone",
    "mention_count",
    "z_score",
    "pre_event_volatility",
    "pre_event_momentum",
    "beta",
]
CATEGORICAL_FEATURES = ["sector"]
BOOLEAN_FEATURES = ["is_earnings_related"]
TARGET = "car_3day"


def build_preprocessor():
    return ColumnTransformer(
        transformers=[
            ("num", "passthrough", NUMERIC_FEATURES + BOOLEAN_FEATURES),
            ("cat", OneHotEncoder(handle_unknown="ignore"), CATEGORICAL_FEATURES),
        ]
    )


def main():
    df = pd.read_csv(INPUT_CSV)

    X = df[NUMERIC_FEATURES + BOOLEAN_FEATURES + CATEGORICAL_FEATURES].copy()
    X["is_earnings_related"] = X["is_earnings_related"].astype(int)
    y = df[TARGET].values

    print(f"Training final model on {len(df)} rows...")

    pipeline = Pipeline([
        ("preprocess", build_preprocessor()),
        ("model", RandomForestRegressor(
            n_estimators=300,
            max_depth=4,
            min_samples_leaf=8,
            random_state=RANDOM_STATE,
        )),
    ])

    pipeline.fit(X, y)

    joblib.dump(pipeline, MODEL_OUTPUT_PATH)
    print(f"Saved trained pipeline to {MODEL_OUTPUT_PATH}")

    # Quick sanity check: reload and predict on the training data itself,
    # just to confirm the saved artifact works end-to-end.
    reloaded = joblib.load(MODEL_OUTPUT_PATH)
    sample_prediction = reloaded.predict(X.iloc[[0]])
    print(f"\nSanity check -- prediction on first training row: {sample_prediction[0]:.5f}")
    print(f"(actual value for that row was: {y[0]:.5f})")


if __name__ == "__main__":
    main()