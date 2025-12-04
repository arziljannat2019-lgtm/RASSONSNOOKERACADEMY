const db = require("../config/db");

// --------------------------------------------------
// GET ALL CANTEEN ITEMS (MENU)
// --------------------------------------------------
exports.getItems = async (req, res) => {
    try {
        const [rows] = await db.execute("SELECT * FROM canteen ORDER BY id ASC");
        res.json({ success: true, items: rows });

    } catch (err) {
        console.error("CANTEEN GET ITEMS ERROR:", err);
        res.status(500).json({ success: false });
    }
};

// --------------------------------------------------
// GET ADDED ITEMS FOR A SESSION
// --------------------------------------------------
exports.getSessionItems = async (req, res) => {
    try {
        const { session_id } = req.params;

        const [rows] = await db.execute(
            "SELECT * FROM canteen_orders WHERE session_id = ? ORDER BY id ASC",
            [session_id]
        );

        res.json({ success: true, items: rows });

    } catch (err) {
        console.error("CANTEEN GET SESSION ITEMS ERROR:", err);
        res.status(500).json({ success: false });
    }
};

// --------------------------------------------------
// ADD ITEM TO SESSION
// --------------------------------------------------
exports.addItem = async (req, res) => {
    try {
        const { session_id, item_id, name, price } = req.body;

        // 1. insert into canteen_orders
        await db.execute(
            "INSERT INTO canteen_orders (session_id, item_id, name, price) VALUES (?, ?, ?, ?)",
            [session_id, item_id, name, price]
        );

        // 2. update canteen_amount in sessions table
        await db.execute(
            "UPDATE sessions SET canteen_amount = canteen_amount + ? WHERE id = ?",
            [price, session_id]
        );

        res.json({ success: true });

    } catch (err) {
        console.error("CANTEEN ADD ITEM ERROR:", err);
        res.status(500).json({ success: false });
    }
};

// --------------------------------------------------
// REMOVE ITEM FROM SESSION
// --------------------------------------------------
exports.removeItem = async (req, res) => {
    try {
        const { id, price } = req.body;

        // get session_id from order
        const [[row]] = await db.execute(
            "SELECT session_id FROM canteen_orders WHERE id = ?",
            [id]
        );

        if (!row)
            return res.json({ success: false, message: "Order not found" });

        const session_id = row.session_id;

        // 1. delete item
        await db.execute("DELETE FROM canteen_orders WHERE id = ?", [id]);

        // 2. update session canteen_amount
        await db.execute(
            "UPDATE sessions SET canteen_amount = canteen_amount - ? WHERE id = ?",
            [price, session_id]
        );

        res.json({ success: true });

    } catch (err) {
        console.error("CANTEEN REMOVE ITEM ERROR:", err);
        res.status(500).json({ success: false });
    }
};
