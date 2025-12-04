const db = require("../config/db");

function mins(a, b) {
    return Math.ceil((new Date(b) - new Date(a)) / 60000);
}

// ================================
// CHECK-OUT  (FINAL FIXED VERSION)
// ================================
exports.doCheckout = (req, res) => {
    const id = req.body.session_id;
    const ct = new Date();

    db.query(`
        SELECT s.*, 
               t.table_name, t.frame_rate, t.century_rate, t.branch,
               (SELECT IFNULL(SUM(total),0) FROM canteen WHERE session_id=s.id) AS canteen_total
        FROM sessions s 
        JOIN tables t ON t.id=s.table_id
        WHERE s.id=?`,
        [id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err });
            if (!rows.length) return res.status(404).json({ error: "Session not found" });

            const s = rows[0];

            const playMin = mins(s.checkin_time, ct);
            const rate = (s.rate_type === "frame") ? s.frame_rate : s.century_rate;
            const tableAmount = playMin * rate;

            const canteenAmount = s.canteen_total || 0;
            const totalBill = tableAmount + canteenAmount;

            // UPDATE SESSION
            db.query(
                "UPDATE sessions SET checkout_time=?, amount=?, canteen_amount=?, total_bill=?, status='unpaid' WHERE id=?",
                [ct, tableAmount, canteenAmount, totalBill, id]
            );

            res.json({
                message: "ok",
                session_id: id,
                checkout_time: ct,
                amount: tableAmount,
                canteen_amount: canteenAmount,
                total_bill: totalBill
            });
        }
    );
};


// ================================
// BILL POPUP (WORKS WITH ABOVE)
// ================================
exports.getBill = (req, res) => {
    db.query(`
        SELECT s.*, 
               t.table_name, t.branch,
               (SELECT IFNULL(SUM(total),0) FROM canteen WHERE session_id=s.id) AS canteen_total
        FROM sessions s
        JOIN tables t ON t.id=s.table_id
        WHERE s.id=?
    `,
        [req.params.session_id],
        (err, rows) => {
            if (err) return res.status(500).json({ error: err });
            if (!rows.length) return res.status(404).json({ error: "No bill found" });

            const s = rows[0];

            res.json({
                session_id: s.id,
                table_name: s.table_name,
                branch: s.branch,
                checkin_time: s.checkin_time,
                checkout_time: s.checkout_time,
                amount: s.amount,
                canteen_amount: s.canteen_total,
                total_bill: s.total_bill,
                status: s.status
            });
        }
    );
};


// ================================
// MARK BILL AS PAID
// ================================
exports.markPaid = (req, res) => {
    const { session_id } = req.body;

    db.query("UPDATE sessions SET status='paid' WHERE id=?", [session_id],
        err => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: "Bill marked as paid" });
        }
    );
};
