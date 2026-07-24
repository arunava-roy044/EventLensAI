"""
One-off script to extract the real percentile/median values from the
training dataset that ground the live sentiment dropdown mapping.

Run once. Output is printed to stdout — the resulting constants are then
hardcoded into event_model.py.
"""

import pandas as pd
import numpy as np

INPUT_CSV = "../data_collection/training_dataset.csv"

def main():
    df = pd.read_csv(INPUT_CSV)
    print(f"Dataset: {len(df)} rows\n")

    # avg_tone percentiles for the 5-point sentiment dropdown
    percentiles = [10, 30, 50, 70, 90]
    tone_values = np.percentile(df["avg_tone"], percentiles)
    print("avg_tone percentiles (for sentiment dropdown mapping):")
    for p, v in zip(percentiles, tone_values):
        print(f"  P{p}: {v:.6f}")

    # Medians for features that default to training-data median at inference time
    median_mention = df["mention_count"].median()
    median_zscore = df["z_score"].median()
    median_momentum = df["pre_event_momentum"].median()

    print(f"\nMedian mention_count: {median_mention:.6f}")
    print(f"Median z_score:       {median_zscore:.6f}")
    print(f"Median pre_event_momentum: {median_momentum:.6f}")

    # Also print some basic stats for sanity-checking
    print(f"\navg_tone range: [{df['avg_tone'].min():.4f}, {df['avg_tone'].max():.4f}]")
    print(f"mention_count range: [{df['mention_count'].min()}, {df['mention_count'].max()}]")
    print(f"z_score range: [{df['z_score'].min():.4f}, {df['z_score'].max():.4f}]")


if __name__ == "__main__":
    main()
