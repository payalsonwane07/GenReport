import pandas as pd


def process_data(path):
    lower_path = path.lower()
    if lower_path.endswith(".csv"):
        return pd.read_csv(path)
    return pd.read_excel(path)
