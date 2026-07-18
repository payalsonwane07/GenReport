const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getStats, getTemplates } = require('../controllers/dashboardController');

router.get('/stats', auth, getStats);
router.get('/templates', auth, getTemplates);

module.exports = router;
