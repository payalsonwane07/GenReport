import os
from backend.config import Config


def build_report(filename, df, analysis, visuals):
    os.makedirs(Config.REPORT_FOLDER, exist_ok=True)
    report_name = f"{os.path.splitext(filename)[0]}_report.html"
    report_path = os.path.join(Config.REPORT_FOLDER, report_name)

    summary_html = ""
    for column, details in analysis["summary"].items():
        summary_html += f"<h4>{column}</h4><pre>{details}</pre>"

    report_html = f"""
<!doctype html>
<html lang=\"en\">
<head>
  <meta charset=\"utf-8\">
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">
  <title>Report - {filename}</title>
</head>
<body>
  <h1>Automated Report</h1>
  <p>Source file: {filename}</p>
  <p>Rows: {analysis['rows']}</p>
  <p>Columns: {analysis['columns']}</p>
  {summary_html}
  <p>Visualizations: {', '.join(visuals) if visuals else 'None'}</p>
</body>
</html>
"""

    with open(report_path, "w", encoding="utf-8") as report_file:
        report_file.write(report_html)

    return report_name
