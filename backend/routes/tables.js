const express = require("express");
const router = express.Router();
const tables = require("../controllers/tablesController");

// GET TABLES
router.get("/list/:branch", tables.listTables);

// ADD NEW TABLE
router.post("/add", tables.addTable);

// EDIT TABLE (FIXED VARIABLE NAME)
router.put("/edit/:id", tables.editTable);

// DELETE TABLE
router.delete("/delete/:id", tables.deleteTable);

// CHECK-IN (ID comes from body)
router.post("/checkin", tables.checkIn);

// CHECK-OUT (ID comes from body)
router.post("/checkout", tables.checkOut);

// RESTORE ACTIVE SESSIONS
router.get("/restore/:branch", tables.restoreTimer);

module.exports = router;
