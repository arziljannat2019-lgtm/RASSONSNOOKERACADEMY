const r = require("express").Router();
const c = require("../controllers/usersController");

r.post("/add", c.addUser);
r.get("/list", c.getAllUsers);
r.post("/login", c.login);

module.exports = r;
