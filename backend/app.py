import os
from flask import Flask, render_template, request, redirect, url_for, send_from_directory, flash
from werkzeug.utils import secure_filename
from backend.config import Config
from backend.modules.data_processor import process_data
from backend.modules.analyzer import analyze_data
from backend.modules.visualizer import create_visuals
from backend.modules.report_generator import build_report

app = Flask(__name__, template_folder="templates", static_folder="static")
app.config.from_object(Config)
app.secret_key = app.config["SECRET_KEY"]

os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
os.makedirs(app.config["REPORT_FOLDER"], exist_ok=True)


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in app.config["ALLOWED_EXTENSIONS"]


@app.route("/")
def index():
    return redirect(url_for("upload"))


@app.route("/upload", methods=["GET", "POST"])
def upload():
    if request.method == "POST":
        if "file" not in request.files:
            flash("No file selected")
            return redirect(request.url)

        file = request.files["file"]
        if file.filename == "":
            flash("No file selected")
            return redirect(request.url)

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            upload_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
            file.save(upload_path)

            data = process_data(upload_path)
            analysis = analyze_data(data)
            visuals = create_visuals(data, filename)
            report_filename = build_report(filename, data, analysis, visuals)

            return redirect(url_for("dashboard", report=report_filename))

        flash("Invalid file type. Please upload a CSV or XLSX file.")
        return redirect(request.url)

    return render_template("upload.html")


@app.route("/dashboard")
def dashboard():
    report = request.args.get("report")
    return render_template("dashboard.html", report=report)


@app.route("/reports/<path:filename>")
def download_report(filename):
    return send_from_directory(app.config["REPORT_FOLDER"], filename)


if __name__ == "__main__":
    app.run(debug=True)
