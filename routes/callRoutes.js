const express = require('express');
const { makeOutboundCall, checkAvailability } = require('../controller/callController');

const router = express.Router();

router.post('/outbound', makeOutboundCall);

router.post('/check-availability', checkAvailability); // <-- New endpoint
module.exports = router;
