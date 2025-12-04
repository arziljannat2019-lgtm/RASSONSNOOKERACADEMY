const r = require("express").Router();
const c = require("../controllers/historyController");

// TABLE HISTORY FOR A SPECIFIC DATE
r.get("/table/:table_id", c.getTableHistory);

// MARK PAID
r.post("/markPaid", c.markPaid);

// TODAY SUMMARY (optional)
r.get("/today/:branch", c.todaySummary);

module.exports = r;
