# Automated Report Generator

A simple Flask-based backend for uploading spreadsheet data, analyzing it, and generating basic HTML reports.

## Project structure

```
automated-report-generator/
│
├── backend/
│   ├── __init__.py
│   ├── app.py
│   ├── config.py
│   ├── requirements.txt
│   │
│   ├── modules/
│   │   ├── __init__.py
│   │   ├── data_processor.py
│   │   ├── analyzer.py
│   │   ├── visualizer.py
│   │   └── report_generator.py
│   │
│   ├── templates/
│   │   ├── base.html
│   │   ├── upload.html
│   │   └── dashboard.html
│   │
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css
│   │   └── js/
│   │       └── script.js
│   │
│   ├── uploads/         # folder only
│   └── reports/         # folder only
├── README.md
└── .gitignore
```

## Setup

1. Create and activate a virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

2. Install dependencies:

```powershell
pip install -r backend/requirements.txt
```

3. Run the app:

```powershell
python backend/app.py
```

4. Open `http://127.0.0.1:5000` in your browser.

## Usage

- Upload a `.csv` or `.xlsx` file.
- The backend reads the file, analyzes the data, and writes a simple HTML report to `backend/reports/`.
- Use the dashboard to download the generated report.
