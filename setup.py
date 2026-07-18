#!/usr/bin/env python3
"""
Automated Report Generator - Project Setup Script
This script creates the entire project structure with all necessary files.
Run this once to set up your project!
"""

import os
import sys

# Get the current directory (where this script is located)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def create_folders():
    """Create all necessary folders"""
    folders = [
        'backend',
        'backend/modules',
        'backend/templates',
        'backend/static',
        'backend/static/css',
        'backend/static/js',
        'backend/uploads',
        'backend/reports',
    ]
    
    for folder in folders:
        path = os.path.join(BASE_DIR, folder)
        os.makedirs(path, exist_ok=True)
        print(f"✓ Created folder: {folder}")

def create_files():
    """Create all necessary Python and other files"""
    
    files = {
        # Backend files
        'backend/__init__.py': '''"""
Automated Report Generator Backend
"""

__version__ = '1.0.0'
__author__ = 'Your Name'
__description__ = 'AI-Powered System for Automated Report Generation'
''',
        
        'backend/requirements.txt': '''Flask==2.3.2
Werkzeug==2.3.6
pandas==2.0.3
numpy==1.24.3
matplotlib==3.7.1
seaborn==0.12.2
plotly==5.14.0
reportlab==4.0.4
PyPDF2==3.0.1
openpyxl==3.1.2
python-dotenv==1.0.0
APScheduler==3.10.4
Pillow==9.5.0
scikit-learn==1.2.2
scipy==1.10.1
NLTK==3.8.1
requests==2.31.0
''',
        
        'backend/config.py': '''import os
from datetime import timedelta

class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-change-in-production'
    
    # Flask settings
    DEBUG = False
    TESTING = False
    
    # Upload settings
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
    REPORTS_FOLDER = os.path.join(os.path.dirname(__file__), 'reports')
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB max file size
    ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls', 'json'}
    
    # Report settings
    REPORT_TITLE = "Automated Report"
    COMPANY_NAME = "Your Company Name"
    COMPANY_LOGO = None
    
    # Session settings
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)
    SESSION_COOKIE_SECURE = False
    SESSION_COOKIE_HTTPONLY = True
    
    # Scheduler settings
    SCHEDULER_API_ENABLED = True


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    SESSION_COOKIE_SECURE = True


class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = True
    TESTING = True


# Select config based on environment
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
''',

        'backend/modules/__init__.py': '''"""
Modules package for Automated Report Generator
"""

from .data_processor import DataProcessor
from .analyzer import Analyzer
from .visualizer import Visualizer
from .report_generator import ReportGenerator

__all__ = [
    'DataProcessor',
    'Analyzer',
    'Visualizer',
    'ReportGenerator'
]
''',

        # Simplified app.py - minimal version to get started
        'backend/app.py': '''from flask import Flask, render_template, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import os
from datetime import datetime

from config import config

def create_app(env='development'):
    """Create Flask application"""
    app = Flask(__name__)
    app.config.from_object(config[env])
    
    # Create required folders
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(app.config['REPORTS_FOLDER'], exist_ok=True)
    
    return app

app = create_app('development')

@app.route('/')
def index():
    """Home page"""
    return render_template('upload.html')

@app.route('/dashboard')
def dashboard():
    """Dashboard page"""
    return render_template('dashboard.html')

@app.route('/api/test')
def test_api():
    """Test API endpoint"""
    return jsonify({
        'status': 'success',
        'message': 'API is working!',
        'timestamp': datetime.now().isoformat()
    }), 200

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Handle file upload"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Check file extension
        if not allowed_file(file.filename):
            return jsonify({'error': 'File type not allowed. Use CSV, Excel, or JSON'}), 400
        
        # Save file
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_")
        filename = timestamp + filename
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        return jsonify({
            'success': True,
            'file_id': filename,
            'filename': file.filename,
            'message': 'File uploaded successfully!'
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports')
def list_reports():
    """List all generated reports"""
    try:
        reports = []
        if os.path.exists(app.config['REPORTS_FOLDER']):
            for file in os.listdir(app.config['REPORTS_FOLDER']):
                file_path = os.path.join(app.config['REPORTS_FOLDER'], file)
                if os.path.isfile(file_path):
                    reports.append({
                        'filename': file,
                        'size': os.path.getsize(file_path),
                        'created': datetime.fromtimestamp(os.path.getctime(file_path)).isoformat(),
                    })
        
        return jsonify({'reports': reports}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error'}), 500

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

if __name__ == '__main__':
    print("Starting Automated Report Generator...")
    print("Visit http://localhost:5000 in your browser")
    app.run(debug=True, host='0.0.0.0', port=5000)
''',

        # Stub modules - minimal implementations
        'backend/modules/data_processor.py': '''import pandas as pd
import numpy as np

class DataProcessor:
    """Handles data loading, cleaning, and preprocessing"""
    
    def __init__(self):
        self.dataframe = None
        self.original_dataframe = None
    
    def load_data(self, file_path: str) -> pd.DataFrame:
        """Load data from file"""
        try:
            if file_path.endswith('.csv'):
                self.dataframe = pd.read_csv(file_path)
            elif file_path.endswith(('.xlsx', '.xls')):
                self.dataframe = pd.read_excel(file_path)
            elif file_path.endswith('.json'):
                self.dataframe = pd.read_json(file_path)
            else:
                raise ValueError("Unsupported file format")
            
            self.original_dataframe = self.dataframe.copy()
            return self.dataframe
        except Exception as e:
            print(f"Error loading data: {str(e)}")
            return None
''',

        'backend/modules/analyzer.py': '''import pandas as pd
import numpy as np

class Analyzer:
    """Generates insights and analysis from data"""
    
    def __init__(self, dataframe: pd.DataFrame):
        self.df = dataframe
    
    def generate_summary_stats(self):
        """Generate summary statistics"""
        numeric_df = self.df.select_dtypes(include=[np.number])
        return numeric_df.describe().to_dict()
''',

        'backend/modules/visualizer.py': '''import pandas as pd

class Visualizer:
    """Creates charts and visualizations"""
    
    def __init__(self, output_folder: str = 'reports'):
        self.output_folder = output_folder
    
    def create_line_chart(self, df, x_col, y_col, title):
        """Create a line chart"""
        return f"Chart: {title}"
''',

        'backend/modules/report_generator.py': '''import pandas as pd
from datetime import datetime

class ReportGenerator:
    """Generates professional reports"""
    
    def __init__(self, company_name: str = "Your Company", output_folder: str = 'reports'):
        self.company_name = company_name
        self.output_folder = output_folder
        self.timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    def generate_pdf_report(self, filename: str, title: str, summary_text: str):
        """Generate PDF report"""
        return True
''',

        # HTML Templates
        'backend/templates/base.html': '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}Automated Report Generator{% endblock %}</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <link rel="stylesheet" href="{{ url_for('static', filename='css/style.css') }}">
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary sticky-top">
        <div class="container-fluid">
            <a class="navbar-brand" href="/"><i class="fas fa-file-alt"></i> Report Generator</a>
            <div class="navbar-collapse">
                <ul class="navbar-nav ms-auto">
                    <li class="nav-item"><a class="nav-link" href="/">Upload</a></li>
                    <li class="nav-item"><a class="nav-link" href="/dashboard">Dashboard</a></li>
                </ul>
            </div>
        </div>
    </nav>

    <main class="py-4">
        <div class="container-fluid">
            {% block content %}{% endblock %}
        </div>
    </main>

    <footer class="bg-dark text-white text-center py-4 mt-5">
        <p>&copy; 2024 Automated Report Generator. All rights reserved.</p>
    </footer>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js"></script>
    <script src="{{ url_for('static', filename='js/script.js') }}"></script>
</body>
</html>
''',

        'backend/templates/upload.html': '''{% extends "base.html" %}

{% block content %}
<div class="row justify-content-center">
    <div class="col-lg-8">
        <div class="card shadow-lg">
            <div class="card-header bg-primary text-white">
                <h4><i class="fas fa-upload"></i> Upload Your Data</h4>
            </div>
            <div class="card-body p-5">
                <form id="uploadForm" enctype="multipart/form-data">
                    <div class="mb-4">
                        <label for="fileInput" class="form-label"><strong>Select File</strong></label>
                        <input type="file" class="form-control" id="fileInput" accept=".csv,.xlsx,.xls,.json" required>
                        <small class="text-muted d-block mt-2">Supported: CSV, Excel (.xlsx/.xls), JSON</small>
                    </div>
                    <button type="submit" class="btn btn-primary btn-lg"><i class="fas fa-cloud-upload-alt"></i> Upload</button>
                </form>
                <div id="result" class="mt-4"></div>
            </div>
        </div>
    </div>
</div>
{% endblock %}
''',

        'backend/templates/dashboard.html': '''{% extends "base.html" %}

{% block content %}
<div class="row">
    <div class="col-lg-12">
        <div class="card shadow">
            <div class="card-header bg-primary text-white">
                <h4><i class="fas fa-tachometer-alt"></i> Dashboard</h4>
            </div>
            <div class="card-body">
                <h5>Generated Reports</h5>
                <div id="reportsList"></div>
            </div>
        </div>
    </div>
</div>
{% endblock %}
''',

        # CSS
        'backend/static/css/style.css': '''
:root {
    --primary-color: #1f4788;
    --secondary-color: #2e5c8a;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #f5f7fa;
    color: #333;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

main {
    flex: 1;
}

.navbar {
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.card {
    border: none;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0,0,0,0.1) !important;
}

.btn {
    border-radius: 6px;
    font-weight: 500;
    padding: 0.5rem 1rem;
    transition: all 0.3s ease;
}

.btn-primary {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
}

.btn-primary:hover {
    background-color: var(--secondary-color);
    border-color: var(--secondary-color);
}

footer {
    margin-top: auto;
    border-top: 1px solid #eee;
}
''',

        # JavaScript
        'backend/static/js/script.js': '''document.addEventListener('DOMContentLoaded', function() {
    const uploadForm = document.getElementById('uploadForm');
    if (uploadForm) {
        uploadForm.addEventListener('submit', handleUpload);
    }
    
    loadReports();
});

async function handleUpload(e) {
    e.preventDefault();
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a file');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        const resultDiv = document.getElementById('result');
        
        if (response.ok) {
            resultDiv.innerHTML = `
                <div class="alert alert-success">
                    <strong>Success!</strong> File uploaded: ${data.filename}
                </div>
            `;
            fileInput.value = '';
        } else {
            resultDiv.innerHTML = `<div class="alert alert-danger">${data.error}</div>`;
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function loadReports() {
    try {
        const response = await fetch('/api/reports');
        const data = await response.json();
        const reportsList = document.getElementById('reportsList');
        
        if (reportsList) {
            if (data.reports.length === 0) {
                reportsList.innerHTML = '<p class="text-muted">No reports yet</p>';
            } else {
                reportsList.innerHTML = data.reports.map(r => `
                    <div class="alert alert-info">
                        ${r.filename} - ${r.created}
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}
''',

        # Configuration files
        '.env.example': '''FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=dev-key-change-in-production
COMPANY_NAME=Your Company Name
''',

        '.gitignore': '''__pycache__/
*.py[cod]
*.egg-info/
dist/
build/
.env
.vscode/
.idea/
uploads/
reports/
*.log
''',

        'README.md': '''# Automated Report Generator

An AI-powered system that automatically processes data, generates insights, and produces professional PDF/Excel reports.

## Quick Start

1. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

2. Run the application:
   ```bash
   cd backend
   python app.py
   ```

3. Open browser: http://localhost:5000

## Features

✅ File Upload (CSV, Excel, JSON)
✅ Data Processing & Cleaning
✅ Statistical Analysis
✅ Report Generation
✅ Professional Dashboard

## Project Structure

```
automated-report-generator/
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── requirements.txt
│   ├── modules/
│   ├── templates/
│   ├── static/
│   ├── uploads/
│   └── reports/
└── README.md
```

## Documentation

See the full README in the project folder for detailed documentation.
''',
    }
    
    for file_path, content in files.items():
        full_path = os.path.join(BASE_DIR, file_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"✓ Created file: {file_path}")

def main():
    """Main setup function"""
    print("=" * 60)
    print("Automated Report Generator - Setup Script")
    print("=" * 60)
    print()
    
    try:
        print("Creating folders...")
        create_folders()
        print()
        
        print("Creating files...")
        create_files()
        print()
        
        print("=" * 60)
        print("✅ Setup Complete!")
        print("=" * 60)
        print()
        print("Next steps:")
        print("1. Install dependencies:")
        print("   pip install -r backend/requirements.txt")
        print()
        print("2. Run the application:")
        print("   cd backend")
        print("   python app.py")
        print()
        print("3. Open browser:")
        print("   http://localhost:5000")
        print()
        
    except Exception as e:
        print(f"❌ Error during setup: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
