const r = require("express").Router();
const db = require("../config/db");

r.get("/:session_id", (req, res) => {
    const id = req.params.session_id;

    db.query(`
        SELECT s.*, t.table_name, t.branch
        FROM sessions s
        JOIN tables t ON t.id = s.table_id
        WHERE s.id=?
    `, [id], (err, result) => {

        if (err) return res.status(500).send("DB Error");
        if (!result.length) return res.send("Invalid session");

        const s = result[0];

        let html = `
<!DOCTYPE html>
<html>
<head>
<title>Print Bill</title>
<style>
body {
    font-family: 'Courier New', monospace;
    width: 260px;
    margin: 0 auto;
    padding: 0;
    font-size: 14px;
}
@page { margin: 0; }

.header {
    text-align: center;
    font-weight: bold;
    font-size: 15px;
}
.branch {
    text-align: center;
    font-weight: bold;
    font-size: 13px;
}
.logo {
    text-align: center;
    font-size: 14px;
    margin-bottom: 8px;
}
.line {
    border-bottom: 1px dashed #000;
    margin: 6px 0;
}
.row {
    display: flex;
    justify-content: space-between;
    margin: 4px 0;
}
.total {
    font-weight: bold;
    font-size: 16px;
}
.footer {
    text-align: center;
    margin-top: 10px;
    font-weight: bold;
}
</style>
</head>
<body>

<div class="header">Rasson Snooker Academy</div>
<div class="branch">${s.branch}</div>
<div class="logo">--- PREMIUM PRINT ---</div>

<div class="line"></div>

<div class="row"><span>Table:</span><span>${s.table_name}</span></div>
<div class="row"><span>CheckIn:</span><span>${new Date(s.checkin_time).toLocaleTimeString()}</span></div>
<div class="row"><span>CheckOut:</span><span>${new Date(s.checkout_time).toLocaleTimeString()}</span></div>

<div class="line"></div>

<div class="row"><span>Amount:</span><span>${s.amount}</span></div>
<div class="row"><span>Canteen:</span><span>${s.canteen_amount}</span></div>

<div class="line"></div>

<div class="row total"><span>Total Bill:</span><span>${s.total_bill}</span></div>

<div class="line"></div>

<div class="footer">
Thank You ❤️<br>
${new Date().toLocaleString()}
</div>

<script>
window.print();
</script>

</body>
</html>
        `;

        res.send(html);
    });
});

module.exports = r;
