import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const app = express();

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.POSTGRES_URL && process.env.POSTGRES_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());

// ---- AUTHENTICATION ----
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'laura123';
    
    if (username === adminUser && password === adminPass) {
        res.json({ token: process.env.JWT_SECRET || 'atelie-secret-token' });
    } else {
        res.status(401).json({ error: 'Credenciais inválidas' });
    }
});

// Auth Middleware for protected routes
app.use('/api', (req, res, next) => {
    if (req.path === '/login') return next();
    if (req.path === '/feedbacks' && req.method === 'GET') return next();

    const authHeader = req.headers.authorization;
    const validToken = process.env.JWT_SECRET || 'atelie-secret-token';
    
    if (authHeader === `Bearer ${validToken}`) {
        next();
    } else {
        res.status(401).json({ error: 'Não autorizado' });
    }
});

// ---- FINANCES API ----
app.get('/api/finances', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM finances ORDER BY date DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/finances', async (req, res) => {
    const { type, description, amount, date } = req.body;
    const entryDate = date || new Date().toISOString();
    try {
        const result = await pool.query(
            'INSERT INTO finances (type, description, amount, date) VALUES ($1, $2, $3, $4) RETURNING *',
            [type, description, amount, entryDate]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ---- MATERIALS API ----
app.get('/api/materials', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM materials ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/materials', async (req, res) => {
    const { name, quantity, unit, cost } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO materials (name, quantity, unit, cost) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, quantity, unit, cost]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ---- ORDERS API ----
app.get('/api/orders', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/orders', async (req, res) => {
    const { clientName, pieceDetails, deliveryDate, status } = req.body;
    const entryStatus = status || 'pendente';
    try {
        const result = await pool.query(
            'INSERT INTO orders (client_name, piece_details, delivery_date, status) VALUES ($1, $2, $3, $4) RETURNING *',
            [clientName, pieceDetails, deliveryDate, entryStatus]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ---- STOCK API ----
app.get('/api/stock', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM stock ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/stock', async (req, res) => {
    const { pieceName, quantity, price } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO stock (piece_name, quantity, price) VALUES ($1, $2, $3) RETURNING *',
            [pieceName, quantity, price]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ---- PRODUCTION LOGS API (Strava) ----
app.get('/api/production_logs', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM production_logs ORDER BY date DESC');
        res.json(result.rows.map(row => ({
            id: row.id,
            pieceName: row.piece_name,
            hoursSpent: row.hours_spent,
            linkedOrderId: row.linked_order_id,
            materialsUsed: JSON.parse(row.materials_used || '[]'),
            date: row.date
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/production_logs', async (req, res) => {
    const { pieceName, hoursSpent, materialsUsed, linkedOrderId } = req.body;
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Deduct materials
        if (materialsUsed && materialsUsed.length > 0) {
            for (const mu of materialsUsed) {
                await client.query(
                    'UPDATE materials SET quantity = quantity - $1 WHERE id = $2',
                    [Number(mu.quantityUsed), mu.materialId]
                );
            }
        }

        // 2. Update order if linked
        if (linkedOrderId) {
            await client.query(
                'UPDATE orders SET status = $1 WHERE id = $2',
                ['concluído', linkedOrderId]
            );
        }

        // 3. Save log
        const result = await client.query(
            'INSERT INTO production_logs (piece_name, hours_spent, materials_used, linked_order_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [pieceName, Number(hoursSpent), JSON.stringify(materialsUsed || []), linkedOrderId || null]
        );

        await client.query('COMMIT');
        
        const row = result.rows[0];
        res.json({
            id: row.id,
            pieceName: row.piece_name,
            hoursSpent: row.hours_spent,
            linkedOrderId: row.linked_order_id,
            materialsUsed: JSON.parse(row.materials_used),
            date: row.date
        });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// ---- FEEDBACKS API ----
app.get('/api/feedbacks', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM feedbacks ORDER BY date DESC');
        res.json(result.rows.map(row => ({
            id: row.id,
            clientName: row.client_name,
            message: row.message,
            rating: row.rating,
            date: row.date
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/feedbacks', async (req, res) => {
    const { clientName, message, rating } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO feedbacks (client_name, message, rating) VALUES ($1, $2, $3) RETURNING *',
            [clientName, message, rating]
        );
        const row = result.rows[0];
        res.json({
            id: row.id,
            clientName: row.client_name,
            message: row.message,
            rating: row.rating,
            date: row.date
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Export app for Vercel Serverless
export default app;

// Local development fallback
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
        console.log(`Local JSON Server running on http://localhost:${PORT}`);
    });
}
