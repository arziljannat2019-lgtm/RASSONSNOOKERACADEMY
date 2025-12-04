const r = require("express").Router();
const c = require("../controllers/expensesController");

r.get("/list/:branch", c.list);
r.post("/add", c.add);
r.put("/update/:id", c.update);    // <-- NEW
r.delete("/delete/:id", c.remove);

module.exports = r;
