const db = require("../config/db");

// DAY HISTORY (by branch + date)
exports.getDayHistory = (req, res) => {
    const branch = req.params.branch;
    const date = req.params.date;

    // session income
    const sessionQuery = `
        SELECT IFNULL(SUM(total_bill),0) AS session_income
        FROM sessions s
        JOIN tables t ON t.id = s.table_id
        WHERE DATE(s.checkout_time)=? AND t.branch=?
    `;

    // canteen income
    const canteenQuery = `
        SELECT IFNULL(SUM(canteen_amount),0) AS canteen_income
        FROM sessions s
        JOIN tables t ON t.id=s.table_id
        WHERE DATE(s.checkout_time)=? AND t.branch=?
    `;

    // expenses
    const expensesQuery = `
        SELECT IFNULL(SUM(amount),0) AS expenses
        FROM expenses 
        WHERE DATE(datetime)=? AND branch=?
    `;

    db.query(sessionQuery, [date, branch], (e1, r1) => {
        if (e1) return res.status(500).json({ error: e1 });

        db.query(canteenQuery, [date, branch], (e2, r2) => {
            if (e2) return res.status(500).json({ error: e2 });

            db.query(expensesQuery, [date, branch], (e3, r3) => {
                if (e3) return res.status(500).json({ error: e3 });

                const sessionIncome = r1[0].session_income;
                const canteenIncome = r2[0].canteen_income;
                const expenses = r3[0].expenses;

                res.json({
                    date,
                    session_income: sessionIncome,
                    canteen_income: canteenIncome,
                    total_income: sessionIncome + canteenIncome,
                    expenses,
                    net: sessionIncome + canteenIncome - expenses
                });
            });
        });
    });
};
