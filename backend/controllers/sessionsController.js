const db = require("../config/db");

// --------------------------------------------------
// GET ACTIVE SESSION (for frontend restore or debugging)
// --------------------------------------------------
exports.getActiveSession = async (req, res) => {
    try {
        const { table_id } = req.params;

        const [[session]] = await db.execute(
            "SELECT * FROM sessions WHERE table_id=? AND status='active' LIMIT 1",
            [table_id]
        );

        if (!session) {
            return res.json({ success: false, message: "No active session" });
        }

        // calculate seconds passed
        const seconds_passed = Math.floor(
            (new Date() - new Date(session.checkin_time)) / 1000
        );

        return res.json({
            success: true,
            session: {
                ...session,
                seconds_passed
            }
        });

    } catch (err) {
        console.error("GET ACTIVE ERROR:", err);
        res.status(500).json({ success: false });
    }
};

// --------------------------------------------------
// UPDATE SESSION TIME (amount + seconds)
// frontend does not call this — session is updated at checkout
// --------------------------------------------------
exports.updateSessionTime = async (req, res) => {
    try {
        const { id } = req.params;
        const { seconds_passed, amount } = req.body;

        await db.execute(
            "UPDATE sessions SET amount=?, updated_at=NOW() WHERE id=?",
            [amount, id]
        );

        res.json({ success: true });

    } catch (err) {
        console.error("UPDATE SESSION ERROR:", err);
        res.status(500).json({ success: false });
    }
};

// --------------------------------------------------
// CLOSE SESSION (called by tablesController)
// --------------------------------------------------
exports.closeSession = async (req, res) => {
    try {
        const { session_id, checkout_time, amount, canteen_amount, total_bill } = req.body;

        await db.execute(
            `UPDATE sessions SET 
                checkout_time=?, 
                amount=?, 
                canteen_amount=?, 
                total_bill=?, 
                status='unpaid' 
             WHERE id=?`,
            [checkout_time, amount, canteen_amount, total_bill, session_id]
        );

        res.json({ success: true });

    } catch (err) {
        console.error("CLOSE SESSION ERROR:", err);
        res.status(500).json({ success: false });
    }
};

// --------------------------------------------------
// GET TODAY HISTORY FOR A TABLE
// --------------------------------------------------
exports.getTodayHistory = async (req, res) => {
    try {
        const { table_id } = req.params;

        const [rows] = await db.execute(
            `
            SELECT 
                id,
                checkin_time,
                checkout_time,
                amount,
                canteen_amount,
                total_bill,
                status
            FROM sessions
            WHERE table_id=? 
            AND DATE(checkin_time)=CURDATE()
            AND status IN ('paid','unpaid')
            ORDER BY id DESC
            `,
            [table_id]
        );

        let formatted = rows.map(r => {
            let playTime = "";

            if (r.checkout_time) {
                let diffSec =
                    (new Date(r.checkout_time) - new Date(r.checkin_time)) / 1000;
                let mins = Math.floor(diffSec / 60);
                let secs = diffSec % 60;

                playTime = `${mins}m ${secs}s`;
            }

            return {
                id: r.id,
                checkin_time: r.checkin_time,
                checkout_time: r.checkout_time,
                play_time: playTime,
                amount: r.amount,
                canteen_amount: r.canteen_amount,
                total: r.total_bill,
                status: r.status
            };
        });

        res.json({ success: true, records: formatted });

    } catch (err) {
        console.error("HISTORY ERROR:", err);
        res.status(500).json({ success: false });
    }
};

// --------------------------------------------------
// GET ONE HISTORY RECORD (for reprint)
// --------------------------------------------------
exports.getHistoryDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const [[row]] = await db.execute(
            "SELECT * FROM sessions WHERE id=?",
            [id]
        );

        if (!row) return res.json({ success: false });

        let playTime = "";

        if (row.checkout_time) {
            let diffSec =
                (new Date(row.checkout_time) - new Date(row.checkin_time)) / 1000;
            let mins = Math.floor(diffSec / 60);
            let secs = diffSec % 60;

            playTime = `${mins}m ${secs}s`;
        }

        res.json({
            success: true,
            record: {
                id: row.id,
                table_id: row.table_id,
                checkin_time: row.checkin_time,
                play_time: playTime,
                amount: row.amount,
                canteen_amount: row.canteen_amount,
                total: row.total_bill,
                rate: row.rate_type
            }
        });

    } catch (err) {
        console.error("HISTORY DETAIL ERROR:", err);
        res.status(500).json({ success: false });
    }
};

// --------------------------------------------------
// MARK HISTORY AS PAID
// --------------------------------------------------
exports.markPaid = async (req, res) => {
    try {
        const { id } = req.body;

        await db.execute(
            "UPDATE sessions SET status='paid' WHERE id=?",
            [id]
        );

        res.json({ success: true });
    } catch (err) {
        console.error("PAY HISTORY ERROR:", err);
        res.status(500).json({ success: false });
    }
};
