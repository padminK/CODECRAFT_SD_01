const express = require('express');
const router = express.Router();
const { createLead } = require('../controllers/leadController');
const validateLead = require('../middleware/validateLead');

// POST /api/leads - with validateLead middleware
router.post('/', validateLead, createLead);

module.exports = router;