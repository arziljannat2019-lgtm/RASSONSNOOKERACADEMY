const db = require("../config/db");

// GET ITEMS
exports.getItems = (req, res) => {
    db.query("SELECT * FROM inventory ORDER BY id DESC", (err, rows) => {
        if (err) return res.status(500).json({ error: err });
        res.json(rows);
    });
};

// ADD ITEM
exports.addItem = (req, res) => {
    const { name, qty, price } = req.body;

    db.query(
        "INSERT INTO inventory (name, qty, price) VALUES (?,?,?)",
        [name, qty, price],
        (err) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: "Added" });
        }
    );
};

// UPDATE ITEM
exports.updateItem = (req, res) => {
    const { name, qty, price } = req.body;

    db.query(
        "UPDATE inventory SET name=?, qty=?, price=? WHERE id=?",
        [name, qty, price, req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: "Updated" });
        }
    );
};

// DELETE ITEM
exports.deleteItem = (req, res) => {
    db.query(
        "DELETE FROM inventory WHERE id=?",
        [req.params.id],
        (err) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: "Deleted" });
        }
    );
};
