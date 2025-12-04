const db = require("../config/db");

// --------------------------------------------------
// LIST TABLES
// --------------------------------------------------
exports.listTables = async (req, res) => {
    try {
        const { branch } = req.params;

        const [rows] = await db.execute(
            "SELECT * FROM tables WHERE branch = ? ORDER BY id ASC",
            [branch]
        );

        res.json({ success: true, tables: rows });
    } catch (err) {
        console.error("LIST TABLE ERROR:", err);
        res.status(500).json({ success: false });
    }
};

// --------------------------------------------------
// ADD TABLE
// --------------------------------------------------
exports.addTable = async (req, res) => {
    try {
        const { table_name, frame_rate, century_rate, branch } = req.body;

        await db.execute(
            "INSERT INTO tables (table_name, frame_rate, century_rate, branch, status) VALUES (?, ?, ?, ?, 'free')",
            [table_name, frame_rate, century_rate, branch]
        );

        res.json({ success: true });
    } catch (err) {
        console.error("ADD TABLE ERROR:", err);
        res.status(500).json({ success: false });
    }
};

// --------------------------------------------------
// DELETE TABLE
// --------------------------------------------------
exports.deleteTable = async (req, res) => {
    try {
        const { id } = req.params;

        await db.execute("DELETE FROM tables WHERE id = ?", [id]);
        res.json({ success: true });

    } catch (err) {
        console.error("DELETE TABLE ERROR:", err);
        res.status(500).json({ success: false });
    }
};

// --------------------------------------------------
// CHECK-IN (ADVANCED SESSION START)
// --------------------------------------------------
exports.checkIn = async (req, res) => {
    try {
        const { id } = req.body;   // ← FIXED (use body)

        // get table rates
        const [[table]] = await db.execute(
            "SELECT frame_rate, century_rate FROM tables WHERE id = ?",
            [id]
        );

        if (!table) return res.json({ success: false, message: "Table not found" });

        const checkin_time = new Date();

        await db.execute(
            `INSERT INTO sessions 
                (table_id, branch, checkin_time, rate_type, amount, canteen_amount, total_bill, status) 
             VALUES (?, ?, ?, 'frame', 0, 0, 0, 'active')`,
            [id, req.body.branch || "Rasson 1", checkin_time]
        );

        await db.execute(
            "UPDATE tables SET status='active', checkin_time=? WHERE id=?",
            [checkin_time, id]
        );

        res.json({
            success: true,
            session: {
                checkin_time,
                frame_rate: table.frame_rate,
                century_rate: table.century_rate
            }
        });

    } catch (err) {
        console.error("CHECKIN ERROR:", err);
        res.status(500).json({ success: false });
    }
};


// --------------------------------------------------
// CHECK-OUT (ADVANCED SESSION CLOSE)
// --------------------------------------------------
exports.checkOut = async (req, res) => {
    try {
        const { id } = req.params;
        const { checkout_time, amount, canteen_amount, total_bill } = req.body;

        // get active session of this table
        const [[session]] = await db.execute(
            "SELECT * FROM sessions WHERE table_id=? AND status='active'",
            [id]
        );

        if (!session) {
            return res.json({ success: false, message: "No active session found" });
        }

        // update session record
        await db.execute(
            `UPDATE sessions SET 
                checkout_time=?, 
                amount=?, 
                canteen_amount=?, 
                total_bill=?, 
                status='unpaid'
             WHERE id=?`,
            [checkout_time, amount, canteen_amount, total_bill, session.id]
        );

        // update table
        await db.execute(
            "UPDATE tables SET status='free', checkout_time=?, amount=? WHERE id=?",
            [checkout_time, total_bill, id]
        );

        res.json({ success: true });

    } catch (err) {
        console.error("CHECKOUT ERROR:", err);
        res.status(500).json({ success: false });
    }
};

// --------------------------------------------------
// RESTORE ACTIVE SESSIONS
// --------------------------------------------------
exports.restoreTimer = async (req, res) => {
    try {
        const { branch } = req.params;

        const [tables] = await db.execute(
            "SELECT * FROM tables WHERE branch=? AND status='active'",
            [branch]
        );

        let active = [];

        for (let t of tables) {
            const [[session]] = await db.execute(
                "SELECT * FROM sessions WHERE table_id=? AND status='active'",
                [t.id]
            );

            if (!session) continue;

            let seconds_passed = Math.floor(
                (new Date() - new Date(session.checkin_time)) / 1000
            );

            active.push({
                table_id: t.id,
                frame_rate: t.frame_rate,
                century_rate: t.century_rate,
                checkin_time: session.checkin_time,
                seconds_passed,
                amount: session.amount,
                canteen_amount: session.canteen_amount,
                rate_type: session.rate_type
            });
        }

        res.json({
            success: true,
            activeSessions: active
        });

    } catch (err) {
        console.error("RESTORE ERROR:", err);
        res.status(500).json({ success: false });
    }
};
// =========================
//   EDIT TABLE
// =========================
exports.editTable = (req, res) => {
    const { id } = req.params;
    const { table_name, frame_rate, century_rate } = req.body;

    if (!table_name || !frame_rate || !century_rate) {
        return res.status(400).json({
            success: false,
            message: "Missing required fields"
        });
    }

    const query = `
        UPDATE tables 
        SET table_name = ?, frame_rate = ?, century_rate = ?
        WHERE id = ?
    `;

    db.query(query, [table_name, frame_rate, century_rate, id], (err, result) => {
        if (err) {
            console.error("EDIT TABLE ERROR:", err);
            return res.status(500).json({
                success: false,
                message: "Database error"
            });
        }

        return res.json({
            success: true,
            message: "Table updated successfully"
        });
    });
};

