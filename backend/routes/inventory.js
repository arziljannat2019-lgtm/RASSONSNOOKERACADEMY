const r = require("express").Router();
const c = require("../controllers/inventoryController");

// GET ALL ITEMS
r.get("/", c.getItems);

// ADD ITEM
r.post("/add", c.addItem);

// UPDATE ITEM
r.put("/update/:id", c.updateItem);

// DELETE ITEM
r.delete("/delete/:id", c.deleteItem);

module.exports = r;
