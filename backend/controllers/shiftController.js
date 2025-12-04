const db = require("../config/db");

// --------------------------------------------------------------
// SHIFT ACTIVE SESSION FROM ONE TABLE TO ANOTHER
// --------------------------------------------------------------
exports.shiftSession = async (req, res) => {
    const { from_table, to_table, branch } = req.body;

    try {
        // 1) GET ACTIVE SESSION OF FROM_TABLE
        const [[session]] = await db.execute(
            "SELECT * FROM sessions WHERE table_id=? AND status='active' LIMIT 1",
            [from_table]
        );

        if (!session) {
            return res.json({
                success: false,
                message: "No active session found for this table"
            });
        }

        // 2) MAKE SURE TARGET TABLE IS FREE
        const [[target]] = await db.execute(
            "SELECT status FROM tables WHERE id=?",
            [to_table]
        );

        if (!target) {
            return res.json({ success: false, message: "Target table not found" });
        }

        if (target.status === "active") {
            return res.json({
                success: false,
                message: "Target table already in use"
            });
        }

        // 3) UPDATE SESSION TABLE_ID → MOVE SESSION
        await db.execute(
            "UPDATE sessions SET table_id=? WHERE id=?",
            [to_table, session.id]
        );

        // 4) UPDATE TABLE STATUS (OLD TABLE → FREE)
        await db.execute(
            "UPDATE tables SET status='free', checkin_time=NULL WHERE id=?",
            [from_table]
        );

        // 5) UPDATE TABLE STATUS (NEW TABLE → ACTIVE)
        await db.execute(
            "UPDATE tables SET status='active', checkin_time=? WHERE id=?",
            [session.checkin_time, to_table]
        );

        res.json({
            success: true,
            message: `Session shifted ${from_table} → ${to_table}`
        });

    } catch (err) {
        console.error("SHIFT ERROR:", err);
        res.status(500).json({ success: false });
    }
};
