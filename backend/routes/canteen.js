const express = require("express");
const router = express.Router();
const c = require("../controllers/canteenController");

// MENU
router.get("/items", c.getItems);

// SESSION ITEMS
router.get("/session/:session_id", c.getSessionItems);

// ADD ITEM
router.post("/add", c.addItem);

// REMOVE ITEM
router.post("/remove", c.removeItem);

module.exports = router;
