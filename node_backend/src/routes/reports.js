const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');
const {
  uploadFile,
  listReports,
  getReport,
  deleteReport,
  generateReport,
  downloadReport,
} = require('../controllers/reportController');

// POST - Upload files (protected)
router.post('/upload', auth, uploadLimiter, upload.array('files', 5), uploadFile);

// GET - List all reports for logged-in user (protected)
router.get('/', auth, listReports);

// GET - Get specific report by ID (protected)
router.get('/:id', auth, getReport);

// POST - Generate/regenerate report (protected)
router.post('/:id/generate', auth, generateReport);

// GET - Download PDF report (protected)
router.get('/:id/download', auth, downloadReport);

// DELETE - Delete report (protected)
router.delete('/:id', auth, deleteReport);

module.exports = router;
