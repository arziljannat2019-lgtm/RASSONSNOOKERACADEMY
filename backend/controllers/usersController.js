const db = require("../config/db");

/* ============================================
   LOGIN (PLAIN PASSWORD)
============================================ */
exports.login = async (req, res) => {
    try {
        const { username, password, branch } = req.body;

        const normalizedBranch = branch
            .replace(/\s+/g, " ")
            .replace(/\u00A0/g, " ")
            .trim()
            .toLowerCase();

        const q = `
            SELECT id, username, password, role, branch
            FROM users
            WHERE username=? AND password=?
            LIMIT 1
        `;

        const [rows] = await db.execute(q, [username, password]);

        if (rows.length === 0) {
            return res.json({
                success: false,
                message: "Invalid username or password"
            });
        }

        const user = rows[0];
        const dbBranch = (user.branch || "").toLowerCase().trim();

        if (user.role !== "admin" && normalizedBranch !== dbBranch) {
            return res.json({
                success: false,
                message: "Invalid branch selected"
            });
        }

        return res.json({
            success: true,
            message: "Login successful",
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                branch: user.branch
            }
        });

    } catch (err) {
        console.log("LOGIN ERROR =", err);
        return res.json({
            success: false,
            message: "Login failed, server error"
        });
    }
};


/* ============================================
   GET ALL USERS
============================================ */
exports.getAllUsers = async (req, res) => {
    try {
        const q = `SELECT id, username, role, branch FROM users ORDER BY id DESC`;
        const [rows] = await db.execute(q);
        res.json(rows);
    } catch (err) {
        console.log("GET USERS ERROR =", err);
        res.json([]);
    }
};


/* ============================================
   ADD USER
============================================ */
exports.addUser = async (req, res) => {
    try {
        const { username, password, role, branch } = req.body;

        const q = `
            INSERT INTO users (username, password, role, branch)
            VALUES (?, ?, ?, ?)
        `;

        await db.execute(q, [username, password, role, branch]);

        res.json({ success: true, message: "User added successfully" });

    } catch (err) {
        console.log("ADD USER ERROR =", err);
        res.json({ success: false, message: "Failed to add user" });
    }
};


/* ============================================
   DELETE USER
============================================ */
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const q = `DELETE FROM users WHERE id=?`;
        await db.execute(q, [id]);

        res.json({ success: true });

    } catch (err) {
        console.log("DELETE USER ERROR =", err);
        res.json({ success: false });
    }
};


/* ============================================
   UPDATE USER
============================================ */
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { username, password, role, branch } = req.body;

        const q = `
            UPDATE users 
            SET username=?, password=?, role=?, branch=?
            WHERE id=?
        `;

        await db.execute(q, [username, password, role, branch, id]);

        res.json({ success: true });

    } catch (err) {
        console.log("UPDATE USER ERROR =", err);
        res.json({ success: false });
    }
};
