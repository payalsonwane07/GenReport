const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  generateReport,
  downloadReport,
  listReports,
} = require('../controllers/pdfReportController');

router.post('/generate-report', auth, generateReport);
router.get('/download-report/:reportId', auth, downloadReport);
router.get('/reports', auth, listReports);

module.exports = router;
