const r = require("express").Router();
const c = require("../controllers/checkoutController");

r.post("/checkout", c.doCheckout);
r.get("/bill/:session_id", c.getBill);
r.post("/markPaid", c.markPaid);

module.exports = r;
