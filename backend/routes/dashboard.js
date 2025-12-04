const r = require("express").Router();
const c = require("../controllers/dashboardController");

// Dashboard Summary
r.get("/summary/:branch", c.getSummary);

module.exports = r;
