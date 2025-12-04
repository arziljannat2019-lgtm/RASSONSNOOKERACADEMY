const r = require("express").Router();
const c = require("../controllers/dayHistoryController");

// GET DAY HISTORY (date required)
r.get("/:branch/:date", c.getDayHistory);

module.exports = r;
