// =============================================================
//  RASSON SNOOKER ACADEMY - FINAL UPDATED SERVER.JS
// =============================================================

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

// -------------------------------------------------------------
//  MIDDLEWARES
// -------------------------------------------------------------
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// -------------------------------------------------------------
//  ROUTES LOADING
// -------------------------------------------------------------

// TABLES (Add, Edit, Delete, Check-in, Check-out, Restore)
app.use("/api/tables", require("./routes/tables"));

// SESSIONS (History, Active, Close)
app.use("/api/sessions", require("./routes/sessions"));

// CANTEEN ITEMS
app.use("/api/canteen", require("./routes/canteen"));

// EXPENSES
app.use("/api/expenses", require("./routes/expenses"));

// INVENTORY
app.use("/api/inventory", require("./routes/inventory"));

// DAY HISTORY (old system, still used)
app.use("/api/day-history", require("./routes/dayhistory"));

// TABLE HISTORY (old)
app.use("/api/history", require("./routes/history"));

// SHIFT TABLE MOVE (old shift-to-table)
app.use("/api/shifts", require("./routes/shifts"));

// NEW SHIFT SYSTEM + DAY CLOSE + SHIFT1/SHIFT2 + NEW REPORTS
app.use("/api/reports", require("./routes/reports"));

// DASHBOARD STATS
app.use("/api/dashboard", require("./routes/dashboard"));

// USERS (Auth)
app.use("/api/users", require("./routes/users"));
app.use("/api/checkout", require("./routes/checkout"));



// -------------------------------------------------------------
//  SERVER START
// -------------------------------------------------------------
app.listen(5000, () => {
    console.log("🔥 Backend running perfectly on port 5000");
});

