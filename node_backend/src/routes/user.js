const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getTheme, saveTheme, updateTheme } = require('../controllers/themeController');

router.get('/theme', auth, getTheme);
router.post('/theme', auth, saveTheme);
router.put('/theme', auth, updateTheme);

module.exports = router;
