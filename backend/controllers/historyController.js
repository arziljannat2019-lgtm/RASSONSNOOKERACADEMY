const db = require("../config/db");

// TABLE HISTORY: BY DATE + TABLE
exports.getTableHistory = (req, res) => {
    const table_id = req.params.table_id;
    const date = req.query.date;

    const q = `
        SELECT 
            s.id AS session_id,
            s.checkin_time,
            s.checkout_time,
            TIMESTAMPDIFF(MINUTE, s.checkin_time, s.checkout_time) AS minutes,
            s.amount,
            s.canteen_amount AS items_total,
            s.total_bill AS total,
            s.status AS payment_status
        FROM sessions s
        WHERE s.table_id=? 
        AND DATE(s.checkin_time)=?
        ORDER BY s.id DESC
    `;

    db.query(q, [table_id, date], (err, rows) => {
        if (err) return res.status(500).json({ error: err });
        res.json(rows);
    });
};

// MARK PAID
exports.markPaid = (req, res) => {
    const { session_id } = req.body;

    db.query(
        "UPDATE sessions SET status='paid' WHERE id=?",
        [session_id],
        (err) => {
            if (err) return res.status(500).json({ error: err });
            res.json({ message: "Marked as paid" });
        }
    );
};

// TODAY INCOME SUMMARY
exports.todaySummary = (req, res) => {
    const branch = req.params.branch;

    const q = `
        SELECT 
            SUM(total_bill) AS income,
            SUM(canteen_amount) AS canteen_income
        FROM sessions s 
        JOIN tables t ON t.id=s.table_id
        WHERE DATE(s.checkout_time)=CURDATE()
        AND t.branch=?
    `;

    db.query(q, [branch], (err, rows) => {
        if (err) return res.status(500).json({ error: err });

        res.json({
            income: rows[0].income || 0,
            canteen_income: rows[0].canteen_income || 0
        });
    });
};
