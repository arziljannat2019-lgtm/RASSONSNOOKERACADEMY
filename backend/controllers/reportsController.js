const db = require("../config/db");

// --------------------------------------------------------------
// DAY SUMMARY (For Part 9 frontend)
// --------------------------------------------------------------
exports.daySummary = async (req, res) => {
    try {
        const { branch } = req.params;

        // TOTAL SESSIONS
        const [[sessionsCount]] = await db.execute(
            `
            SELECT COUNT(*) AS count 
            FROM sessions 
            WHERE branch=? 
            AND DATE(checkin_time)=CURDATE()
            `,
            [branch]
        );

        // PAID & UNPAID
        const [[paid]] = await db.execute(
            `SELECT COUNT(*) AS count FROM sessions 
             WHERE branch=? AND status='paid' AND DATE(checkin_time)=CURDATE()`,
            [branch]
        );

        const [[unpaid]] = await db.execute(
            `SELECT COUNT(*) AS count FROM sessions 
             WHERE branch=? AND status='unpaid' AND DATE(checkin_time)=CURDATE()`,
            [branch]
        );

        // TIME AMOUNT
        const [[timeAmount]] = await db.execute(
            `SELECT SUM(amount) AS total 
             FROM sessions 
             WHERE branch=? AND DATE(checkout_time)=CURDATE()`,
            [branch]
        );

        // CANTEEN AMOUNT
        const [[canteenAmount]] = await db.execute(
            `SELECT SUM(canteen_amount) AS total 
             FROM sessions 
             WHERE branch=? AND DATE(checkout_time)=CURDATE()`,
            [branch]
        );

        // TOTAL REVENUE
        const [[totalRevenue]] = await db.execute(
            `SELECT SUM(total_bill) AS total 
             FROM sessions 
             WHERE branch=? AND DATE(checkout_time)=CURDATE()`,
            [branch]
        );

        // TABLES USED TODAY
        const [[tablesUsed]] = await db.execute(
            `
            SELECT COUNT(DISTINCT table_id) AS count 
            FROM sessions 
            WHERE branch=? AND DATE(checkin_time)=CURDATE()
            `,
            [branch]
        );

        let summary = {
            tables_used: tablesUsed.count || 0,
            sessions: sessionsCount.count || 0,
            paid: paid.count || 0,
            unpaid: unpaid.count || 0,
            time_amount: timeAmount.total || 0,
            canteen_amount: canteenAmount.total || 0,
            total_revenue: totalRevenue.total || 0,
            open_time: "09:00 AM",
            now: new Date().toLocaleString(),
        };

        res.json({ success: true, summary });

    } catch (err) {
        console.error("DAY SUMMARY ERROR:", err);
        res.status(500).json({ success: false });
    }
};

// --------------------------------------------------------------
// SHIFT SUMMARY (Use shift_close table for shift accounting)
// --------------------------------------------------------------
exports.shiftSummary = async (req, res) => {
    try {
        const { branch } = req.params;

        // Latest shift_close entry
        const [[shift]] = await db.execute(
            `SELECT * FROM shift_close 
             WHERE branch=? 
             ORDER BY id DESC LIMIT 1`,
            [branch]
        );

        if (!shift)
            return res.json({ success: true, shift: null });

        res.json({ success: true, shift });

    } catch (err) {
        console.error("SHIFT SUMMARY ERROR:", err);
        res.status(500).json({ success: false });
    }
};

// --------------------------------------------------------------
// CLOSE SHIFT (Record snapshot in shift_close)
// --------------------------------------------------------------
exports.closeShift = async (req, res) => {
    try {
        const { branch } = req.body;

        const [[income]] = await db.execute(
            `SELECT SUM(total_bill) AS total 
             FROM sessions 
             WHERE branch=? 
             AND DATE(checkout_time)=CURDATE()`,
            [branch]
        );

        const [[canteen]] = await db.execute(
            `
            SELECT SUM(canteen_amount) AS total 
            FROM sessions 
            WHERE branch=? 
            AND DATE(checkout_time)=CURDATE()
            `,
            [branch]
        );

        const [[expense]] = await db.execute(
            `
            SELECT SUM(amount) AS total 
            FROM expenses 
            WHERE branch=? 
            AND DATE(created_at)=CURDATE()
            `,
            [branch]
        );

        const shift_income = income.total || 0;
        const shift_canteen = canteen.total || 0;
        const shift_expense = expense.total || 0;
        const shift_net = shift_income + shift_canteen - shift_expense;

        await db.execute(
            `
            INSERT INTO shift_close 
            (branch, shift_income, shift_canteen, shift_expense, shift_net) 
            VALUES (?, ?, ?, ?, ?)
            `,
            [branch, shift_income, shift_canteen, shift_expense, shift_net]
        );

        res.json({ success: true });

    } catch (err) {
        console.error("SHIFT CLOSE ERROR:", err);
        res.status(500).json({ success: false });
    }
};

// --------------------------------------------------------------
// DAILY CLOSE (Write totals to day_close table)
// --------------------------------------------------------------
exports.dayClose = async (req, res) => {
    try {
        const { branch } = req.body;

        const [[income]] = await db.execute(
            `SELECT SUM(total_bill) AS total 
             FROM sessions 
             WHERE branch=? 
             AND DATE(checkout_time)=CURDATE()`,
            [branch]
        );

        const [[expense]] = await db.execute(
            `SELECT SUM(amount) AS total 
             FROM expenses 
             WHERE branch=? 
             AND DATE(created_at)=CURDATE()`,
            [branch]
        );

        const total_income = income.total || 0;
        const total_expense = expense.total || 0;
        const net_amount = total_income - total_expense;

        await db.execute(
            `
            INSERT INTO day_close (branch, total_income, total_expense, net_amount)
            VALUES (?, ?, ?, ?)
            `,
            [branch, total_income, total_expense, net_amount]
        );

        res.json({ success: true });

    } catch (err) {
        console.error("DAY CLOSE ERROR:", err);
        res.status(500).json({ success: false });
    }
};
