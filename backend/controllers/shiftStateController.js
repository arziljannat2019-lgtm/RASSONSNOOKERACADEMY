const db = require("../config/db");

/* ----------------------------------------------------------
   1) GET CURRENT SHIFT
----------------------------------------------------------- */
exports.getCurrentShift = async (req, res) => {
    const { branch } = req.params;

    try {
        const [rows] = await db.execute(
            "SELECT * FROM shift_state WHERE branch=? LIMIT 1",
            [branch]
        );

        // If no entry → create shift1 as default
        if (!rows.length) {
            await db.execute(
                "INSERT INTO shift_state (branch, current_shift, is_closed) VALUES (?, 'shift1', 0)",
                [branch]
            );

            return res.json({
                shift: { name: "shift1", closed: false }
            });
        }

        const s = rows[0];

        return res.json({
            shift: {
                name: s.current_shift,
                closed: s.is_closed === 1
            }
        });

    } catch (err) {
        console.error("CURRENT SHIFT ERROR:", err);
        return res.json({ shift: null });
    }
};

/* ----------------------------------------------------------
   2) SHIFT 1 SUMMARY
----------------------------------------------------------- */
exports.shift1Summary = async (req, res) => {
    const { branch } = req.params;

    try {
        const [[row]] = await db.execute(
            `
            SELECT 
                SUM(amount) AS income,
                SUM(canteen_amount) AS canteen,
                SUM(total_bill) AS total
            FROM sessions 
            WHERE branch=? AND shift='shift1'
            `,
            [branch]
        );

        const html = `
            <div class='summary-row'><span>Income:</span><span>Rs ${row.income || 0}</span></div>
            <div class='summary-row'><span>Canteen:</span><span>Rs ${row.canteen || 0}</span></div>
            <div class='summary-row'><span>Total:</span><span>Rs ${row.total || 0}</span></div>
        `;

        return res.json({ shift1Html: html });

    } catch (err) {
        console.error("SHIFT1 SUMMARY ERROR:", err);
        return res.json({ shift1Html: "<p>Error</p>" });
    }
};

/* ----------------------------------------------------------
   3) CLOSE SHIFT 1 → START SHIFT 2
----------------------------------------------------------- */
exports.closeShift1 = async (req, res) => {
    const { branch } = req.body;

    try {
        // Mark all active sessions as shift1
        await db.execute(
            `
            UPDATE sessions 
            SET shift='shift1' 
            WHERE branch=? AND status='active'
            `,
            [branch]
        );

        // Mark shift1 as closed AND switch to shift2
        await db.execute(
            `
            UPDATE shift_state 
            SET current_shift='shift2', is_closed=0 
            WHERE branch=?
            `,
            [branch]
        );

        return res.json({ success: true });

    } catch (err) {
        console.error("CLOSE SHIFT1 ERROR:", err);
        return res.json({ success: false });
    }
};

/* ----------------------------------------------------------
   4) SHIFT 2 SUMMARY
----------------------------------------------------------- */
exports.shift2Summary = async (req, res) => {
    const { branch } = req.params;

    try {
        const [[s1]] = await db.execute(
            `
            SELECT 
                SUM(amount) AS income,
                SUM(canteen_amount) AS canteen,
                SUM(total_bill) AS total
            FROM sessions WHERE branch=? AND shift='shift1'
            `,
            [branch]
        );

        const [[s2]] = await db.execute(
            `
            SELECT 
                SUM(amount) AS income,
                SUM(canteen_amount) AS canteen,
                SUM(total_bill) AS total
            FROM sessions WHERE branch=? AND shift='shift2'
            `,
            [branch]
        );

        return res.json({
            shift1Html: `
                <div class='summary-row'><span>Income:</span><span>Rs ${s1.income || 0}</span></div>
                <div class='summary-row'><span>Canteen:</span><span>Rs ${s1.canteen || 0}</span></div>
                <div class='summary-row'><span>Total:</span><span>Rs ${s1.total || 0}</span></div>
            `,
            shift2Html: `
                <div class='summary-row'><span>Income:</span><span>Rs ${s2.income || 0}</span></div>
                <div class='summary-row'><span>Canteen:</span><span>Rs ${s2.canteen || 0}</span></div>
                <div class='summary-row'><span>Total:</span><span>Rs ${s2.total || 0}</span></div>
            `
        });

    } catch (err) {
        console.error("SHIFT2 SUMMARY ERROR:", err);
        return res.json({ shift1Html: "", shift2Html: "" });
    }
};

/* ----------------------------------------------------------
   5) CLOSE SHIFT 2 → DAY CLOSE STAGE
----------------------------------------------------------- */
exports.closeShift2 = async (req, res) => {
    const { branch } = req.body;

    try {
        // Mark remaining active sessions as shift2
        await db.execute(
            `
            UPDATE sessions 
            SET shift='shift2' 
            WHERE branch=? AND status='active'
            `,
            [branch]
        );

        // Mark shift2 closed
        await db.execute(
            `
            UPDATE shift_state 
            SET is_closed=1 
            WHERE branch=?
            `,
            [branch]
        );

        return res.json({ success: true });

    } catch (err) {
        console.error("CLOSE SHIFT2 ERROR:", err);
        return res.json({ success: false });
    }
};

/* ----------------------------------------------------------
   6) DAY CLOSE SUMMARY
----------------------------------------------------------- */
exports.dayCloseSummary = async (req, res) => {
    const { branch } = req.params;

    try {
        const [[s1]] = await db.execute(
            `SELECT SUM(total_bill) AS total FROM sessions WHERE branch=? AND shift='shift1'`,
            [branch]
        );

        const [[s2]] = await db.execute(
            `SELECT SUM(total_bill) AS total FROM sessions WHERE branch=? AND shift='shift2'`,
            [branch]
        );

        const html1 = `
            <div class='summary-row'><span>Total:</span><span>Rs ${s1.total || 0}</span></div>
        `;
        const html2 = `
            <div class='summary-row'><span>Total:</span><span>Rs ${s2.total || 0}</span></div>
        `;
        const combined = `
            <div class='summary-row'><span>Grand Total:</span><span>Rs ${(s1.total||0)+(s2.total||0)}</span></div>
        `;

        return res.json({
            shift1Html: html1,
            shift2Html: html2,
            combinedHtml: combined
        });

    } catch (err) {
        console.error("DAY CLOSE SUMMARY ERROR:", err);
        return res.json({ shift1Html: "", shift2Html: "", combinedHtml: "" });
    }
};

/* ----------------------------------------------------------
   7) FINAL DAY CLOSE
   Reset for next day → shift1, open
----------------------------------------------------------- */
exports.finalDayClose = async (req, res) => {
    const { branch } = req.body;

    try {
        await db.execute(
            `
            UPDATE shift_state 
            SET current_shift='shift1', is_closed=0 
            WHERE branch=?
            `,
            [branch]
        );

        return res.json({ success: true });

    } catch (err) {
        console.error("FINAL DAY CLOSE ERROR:", err);
        return res.json({ success: false });
    }
};
