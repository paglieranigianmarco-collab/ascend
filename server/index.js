const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// ── Helper: generic CRUD factory ───────────────────────────────

function crudRoutes(table, requiredFields = []) {
    const router = express.Router();

    // GET all
    router.get('/', (_req, res) => {
        try {
            const rows = db.prepare(`SELECT * FROM ${table} ORDER BY id DESC`).all();
            res.json(rows);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // GET by id
    router.get('/:id', (req, res) => {
        try {
            const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
            if (!row) return res.status(404).json({ error: 'Not found' });
            res.json(row);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST create
    router.post('/', (req, res) => {
        try {
            const keys = Object.keys(req.body);
            const vals = Object.values(req.body);
            const placeholders = keys.map(() => '?').join(', ');
            const stmt = db.prepare(
                `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`
            );
            const info = stmt.run(...vals);
            const created = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(info.lastInsertRowid);
            res.status(201).json(created);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    // PUT update
    router.put('/:id', (req, res) => {
        try {
            const keys = Object.keys(req.body);
            const vals = Object.values(req.body);
            const setClause = keys.map(k => `${k} = ?`).join(', ');
            const stmt = db.prepare(`UPDATE ${table} SET ${setClause} WHERE id = ?`);
            stmt.run(...vals, req.params.id);
            const updated = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
            if (!updated) return res.status(404).json({ error: 'Not found' });
            res.json(updated);
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    // DELETE
    router.delete('/:id', (req, res) => {
        try {
            const info = db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(req.params.id);
            if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
            res.json({ deleted: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    return router;
}

// ── Mount CRUD routes ──────────────────────────────────────────

app.use('/api/income', crudRoutes('monthly_income'));
app.use('/api/taxes', crudRoutes('taxes'));
app.use('/api/loans', crudRoutes('loans'));
app.use('/api/investments', crudRoutes('investments'));

// ── Dashboard summary endpoint ─────────────────────────────────

app.get('/api/dashboard/summary', (_req, res) => {
    try {
        const cryptoValue = db.prepare(
            `SELECT COALESCE(SUM(current_value), 0) AS total FROM investments WHERE type = 'crypto'`
        ).get().total;

        const stockValue = db.prepare(
            `SELECT COALESCE(SUM(current_value), 0) AS total FROM investments WHERE type = 'stock'`
        ).get().total;

        const cashValue = db.prepare(
            `SELECT COALESCE(SUM(current_value), 0) AS total FROM investments WHERE type = 'transfer'`
        ).get().total;

        const totalLoans = db.prepare(
            `SELECT COALESCE(SUM(remaining_balance), 0) AS total FROM loans`
        ).get().total;

        const totalTaxes = db.prepare(
            `SELECT COALESCE(SUM(estimated_amount) - SUM(paid_amount), 0) AS total FROM taxes WHERE status != 'Paid'`
        ).get().total;

        const netWorth = (cryptoValue + stockValue + cashValue) - (totalLoans + totalTaxes);

        const recentIncome = db.prepare(
            `SELECT * FROM monthly_income ORDER BY month DESC LIMIT 12`
        ).all();

        const upcomingDeadlines = db.prepare(
            `SELECT 'tax' AS category, id, due_date, status, estimated_amount AS amount, 
              'Q' || quarter || ' ' || year AS label
       FROM taxes WHERE status != 'Paid' AND due_date IS NOT NULL
       UNION ALL
       SELECT 'loan' AS category, id, end_date AS due_date, '' AS status, 
              base_payment + extra_payment AS amount, name AS label
       FROM loans WHERE remaining_balance > 0
       ORDER BY due_date ASC LIMIT 10`
        ).all();

        res.json({
            netWorth: { cryptoValue, stockValue, cashValue, totalLoans, totalTaxes, netWorth },
            recentIncome,
            upcomingDeadlines,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Start server ────────────────────────────────────────────────

app.listen(PORT, () => {
    console.log(`\n  🚀  ascend server running at http://localhost:${PORT}\n`);
});
