const db = require("../config/db");

exports.getSummary = (req, res) => {
    try {
        const branch = req.params.branch;

        const output = {
            total_tables: 0,
            active_tables: 0,
            free_tables: 0,
            today_sessions: 0,
            today_completed: 0,
            today_time_income: 0,
            today_canteen_income: 0,
            today_total_income: 0,
            today_unpaid: 0,
            today_paid: 0
        };

        // ============================
        // Helper to run queries in sequence
        // ============================
        const runQuery = (sql, params) =>
            new Promise((resolve, reject) => {
                db.query(sql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows && rows[0] ? rows[0] : {});
                });
            });

        (async () => {
            // TOTAL TABLES
            const totalTables = await runQuery(
                "SELECT COUNT(*) AS total FROM tables WHERE branch=?",
                [branch]
            );
            output.total_tables = totalTables.total || 0;

            // ACTIVE TABLES
            const activeTables = await runQuery(
                `
                SELECT COUNT(*) AS total 
                FROM sessions s 
                JOIN tables t ON t.id=s.table_id 
                WHERE s.status='active' AND t.branch=?
                `,
                [branch]
            );
            output.active_tables = activeTables.total || 0;
            output.free_tables = output.total_tables - output.active_tables;

            // TODAY SESSIONS
            const todaySessions = await runQuery(
                `
                SELECT COUNT(*) AS total 
                FROM sessions s
                JOIN tables t ON t.id=s.table_id
                WHERE DATE(s.checkin_time)=CURDATE() AND t.branch=?
                `,
                [branch]
            );
            output.today_sessions = todaySessions.total || 0;

            // TODAY COMPLETED
            const todayCompleted = await runQuery(
                `
                SELECT COUNT(*) AS total 
                FROM sessions s
                JOIN tables t ON t.id=s.table_id
                WHERE DATE(s.checkout_time)=CURDATE() AND t.branch=?
                `,
                [branch]
            );
            output.today_completed = todayCompleted.total || 0;

            // TIME INCOME TODAY
            const timeIncome = await runQuery(
                `
                SELECT SUM(amount) AS total 
                FROM sessions s
                JOIN tables t ON t.id=s.table_id
                WHERE DATE(s.checkout_time)=CURDATE() AND t.branch=?
                `,
                [branch]
            );
            output.today_time_income = timeIncome.total || 0;

            // CANTEEN INCOME TODAY
            const canteenIncome = await runQuery(
                `
                SELECT SUM(canteen_amount) AS total 
                FROM sessions s
                JOIN tables t ON t.id=s.table_id
                WHERE DATE(s.checkout_time)=CURDATE() AND t.branch=?
                `,
                [branch]
            );
            output.today_canteen_income = canteenIncome.total || 0;

            // TOTAL INCOME
            output.today_total_income =
                output.today_time_income + output.today_canteen_income;

            // UNPAID BILLS
            const unpaidBills = await runQuery(
                `
                SELECT COUNT(*) AS total 
                FROM sessions s
                JOIN tables t ON t.id=s.table_id
                WHERE s.status='unpaid' AND t.branch=?
                `,
                [branch]
            );
            output.today_unpaid = unpaidBills.total || 0;

            // PAID BILLS
            const paidBills = await runQuery(
                `
                SELECT COUNT(*) AS total 
                FROM sessions s
                JOIN tables t ON t.id=s.table_id
                WHERE s.status='paid' AND t.branch=?
                `,
                [branch]
            );
            output.today_paid = paidBills.total || 0;

            res.json(output);
        })().catch(err => {
            console.log("DASHBOARD ERROR:", err);
            res.status(500).json({ error: "Dashboard failed" });
        });

    } catch (err) {
        console.log("DASHBOARD ERROR:", err);
        res.status(500).json({ error: "Dashboard failed" });
    }
};
