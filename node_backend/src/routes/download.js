const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { downloadLimiter } = require('../middleware/rateLimiter');
const { downloadFormat, createDownloadLink } = require('../controllers/downloadController');

function optionalAuth(req, res, next) {
  if (req.query.linkToken) return next();
  return auth(req, res, next);
}

router.get('/:reportId/:format', optionalAuth, downloadLimiter, downloadFormat);
router.post('/:reportId/:format/link', auth, createDownloadLink);

module.exports = router;
