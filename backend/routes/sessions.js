const express = require("express");
const router = express.Router();
const sessions = require("../controllers/sessionsController");

router.get("/active/:table_id", sessions.getActiveSession);
router.get("/history/today/:table_id", sessions.getTodayHistory);
router.get("/history/details/:id", sessions.getHistoryDetails);

router.post("/close", sessions.closeSession);
router.post("/history/pay", sessions.markPaid);

module.exports = router;
