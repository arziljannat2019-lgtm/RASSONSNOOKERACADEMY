const express = require("express");
const router = express.Router();
const shift = require("../controllers/shiftController");

// SHIFT SESSION
router.post("/shift-table", shift.shiftSession);

module.exports = router;
