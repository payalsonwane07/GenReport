def analyze_data(df):
    summary = df.describe(include="all").to_dict()
    return {
        "rows": len(df),
        "columns": len(df.columns),
        "summary": summary,
    }
