const express = require("express");
const router = express.Router();

// OLD controllers (keep them for day-summary, shift-summary, etc.)
const reports = require("../controllers/reportsController");
const dayHistory = require("../controllers/dayHistoryController");
const history = require("../controllers/historyController");

// NEW SHIFT SYSTEM CONTROLLER
const shift = require("../controllers/shiftStateController");

/* ============================================================
   🔥 NEW SHIFT SYSTEM ROUTES (REQUIRED BY FINAL tables.js)
============================================================ */

// GET current shift (shift1 / shift2 + closed)
router.get("/current-shift/:branch", shift.getCurrentShift);

// SHIFT 1 summary (HTML returned)
router.get("/shift1-summary/:branch", shift.shift1Summary);

// SHIFT 2 summary (HTML returned)
router.get("/shift2-summary/:branch", shift.shift2Summary);

// CLOSE SHIFT 1 → START SHIFT 2
router.post("/close-shift1", shift.closeShift1);

// CLOSE SHIFT 2 → go to Day Close
router.post("/close-shift2", shift.closeShift2);

// GET DAY CLOSE summary (Shift1 + Shift2 + Combined)
router.get("/day-close-summary/:branch", shift.dayCloseSummary);

// FINALIZE DAY CLOSE → reset shift to shift1
router.post("/day-close", shift.finalDayClose);


/* ============================================================
   🔷 EXISTING ROUTES (still needed for older features)
============================================================ */

// OLD DAY SUMMARY (used by your Day Summary popup)
router.get("/day-summary/:branch", reports.daySummary);

// OLD SHIFT SUMMARY (just returns last shift_close row — keep for backward compatibility)
router.get("/shift-summary/:branch", reports.shiftSummary);

// OLD CLOSE SHIFT (not used anymore, but kept safe)
router.post("/close-shift", reports.closeShift);

// OLD FINAL DAY CLOSE (deprecated — replaced by new system)
router.post("/close-day", reports.dayClose);


/* ============================================================
   🔷 DAY HISTORY (existing backend)
============================================================ */
router.get("/day-history/:branch/:date", dayHistory.getDayHistory);


/* ============================================================
   🔷 TABLE HISTORY (existing backend)
============================================================ */
router.get("/table-history/:table_id", history.getTableHistory);


/* ============================================================
   EXPORT ROUTER
============================================================ */
module.exports = router;
