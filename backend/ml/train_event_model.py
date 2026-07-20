"""
Trains and evaluates the event-impact model.

Compares three models via 5-fold cross-validation:
  - naive baseline (predicts the training-fold mean)
  - linear regression
  - constrained Random Forest

Reports MAE, RMSE, R^2, and directional accuracy for each, so we can
honestly assess whether the Random Forest adds real value over simpler
alternatives, given the small sample size (258 rows).
"""

import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.model_selection import KFold, cross_val_predict
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

INPUT_CSV = "../data_collection/training_dataset.csv"
N_FOLDS = 5
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


def build_models():
    preprocessor = build_preprocessor()

    naive = Pipeline([
        ("preprocess", preprocessor),
        ("model", DummyRegressor(strategy="mean")),
    ])

    linear = Pipeline([
        ("preprocess", preprocessor),
        ("model", LinearRegression()),
    ])

    # Constrained given the small sample size: shallow trees, meaningful
    # leaf size, so it can't just memorize individual rows.
    rf = Pipeline([
        ("preprocess", preprocessor),
        ("model", RandomForestRegressor(
            n_estimators=300,
            max_depth=4,
            min_samples_leaf=8,
            random_state=RANDOM_STATE,
        )),
    ])

    return {"naive_baseline": naive, "linear_regression": linear, "random_forest": rf}


def directional_accuracy(y_true, y_pred):
    """Fraction of predictions that get the sign right."""
    return np.mean(np.sign(y_true) == np.sign(y_pred))


def evaluate_model(name, pipeline, X, y, cv):
    y_pred = cross_val_predict(pipeline, X, y, cv=cv)

    mae = mean_absolute_error(y, y_pred)
    rmse = np.sqrt(mean_squared_error(y, y_pred))
    ss_res = np.sum((y - y_pred) ** 2)
    ss_tot = np.sum((y - np.mean(y)) ** 2)
    r2 = 1 - (ss_res / ss_tot)
    dir_acc = directional_accuracy(y, y_pred)

    print(f"\n{name}")
    print(f"  MAE:                 {mae:.5f}")
    print(f"  RMSE:                {rmse:.5f}")
    print(f"  R^2:                 {r2:.4f}")
    print(f"  Directional accuracy: {dir_acc:.3f}  ({dir_acc*100:.1f}%)")

    return {"name": name, "mae": mae, "rmse": rmse, "r2": r2, "directional_accuracy": dir_acc}


def print_feature_importances(df, X, y):
    """Fit RF on the FULL dataset (not CV) purely to inspect feature
    importances for reporting -- not used for performance claims."""
    preprocessor = build_preprocessor()
    rf = RandomForestRegressor(
        n_estimators=300,
        max_depth=4,
        min_samples_leaf=8,
        random_state=RANDOM_STATE,
    )
    pipeline = Pipeline([("preprocess", preprocessor), ("model", rf)])
    pipeline.fit(X, y)

    feature_names = pipeline.named_steps["preprocess"].get_feature_names_out()
    importances = pipeline.named_steps["model"].feature_importances_

    importance_df = pd.DataFrame({
        "feature": feature_names,
        "importance": importances,
    }).sort_values("importance", ascending=False)

    print("\nFeature importances (Random Forest, fit on full dataset):")
    print(importance_df.to_string(index=False))


def main():
    df = pd.read_csv(INPUT_CSV)

    X = df[NUMERIC_FEATURES + BOOLEAN_FEATURES + CATEGORICAL_FEATURES].copy()
    X["is_earnings_related"] = X["is_earnings_related"].astype(int)
    y = df[TARGET].values

    print(f"Dataset: {len(df)} rows")
    print(f"Target mean: {y.mean():.5f}, std: {y.std():.5f}")

    cv = KFold(n_splits=N_FOLDS, shuffle=True, random_state=RANDOM_STATE)
    models = build_models()

    results = []
    for name, pipeline in models.items():
        result = evaluate_model(name, pipeline, X, y, cv)
        results.append(result)

    print("\n" + "=" * 60)
    print("SUMMARY (5-fold cross-validated)")
    print("=" * 60)
    summary_df = pd.DataFrame(results).set_index("name")
    print(summary_df.to_string())

    print_feature_importances(df, X, y)


if __name__ == "__main__":
    main()