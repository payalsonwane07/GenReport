import os

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = "change-me-for-production"
    UPLOAD_FOLDER = os.path.join(basedir, "uploads")
    REPORT_FOLDER = os.path.join(basedir, "reports")
    ALLOWED_EXTENSIONS = {"csv", "xlsx"}
