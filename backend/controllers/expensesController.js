const db = require("../config/db");

// LIST EXPENSES
exports.list = (req, res) => {
    db.query(
        "SELECT * FROM expenses WHERE branch=? ORDER BY id DESC",
        [req.params.branch],
        (e, rows) => {
            if (e) return res.status(500).json({ error: e });
            res.json(rows);
        }
    );
};

// ADD NEW
exports.add = (req, res) => {
    const { title, amount, branch } = req.body;

    db.query(
        "INSERT INTO expenses (title, amount, branch) VALUES (?,?,?)",
        [title, amount, branch],
        (e) => {
            if (e) return res.json({ success: false, message: "DB Error" });
            res.json({ success: true });
        }
    );
};

// UPDATE
exports.update = (req, res) => {
    const id = req.params.id;
    const { title, amount } = req.body;

    db.query(
        "UPDATE expenses SET title=?, amount=? WHERE id=?",
        [title, amount, id],
        (e, result) => {
            if (e) return res.status(500).json({ success: false, message: "DB Error" });
            res.json({ success: true });
        }
    );
};

// DELETE
exports.remove = (req, res) => {
    db.query(
        "DELETE FROM expenses WHERE id=?",
        [req.params.id],
        (e) => {
            if (e) return res.status(500).json({ error: e });
            res.json({ success: true });
        }
    );
};
