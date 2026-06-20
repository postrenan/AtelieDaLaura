import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const { Pool } = pg;
const app = express();
app.disable('x-powered-by');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.POSTGRES_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ---- AUTHENTICATION ----
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'laura123';
    
    if (username === adminUser && password === adminPass) {
        res.json({ token: process.env.JWT_SECRET || 'alma-secret-token' });
    } else {
        res.status(401).json({ error: 'Credenciais inválidas' });
    }
});

// Auth Middleware for protected routes
app.use('/api', (req, res, next) => {
    if (req.path === '/login') return next();
    if (req.path === '/feedbacks' && req.method === 'GET') return next();
    if (req.path === '/products' && req.method === 'GET') return next();

    const authHeader = req.headers.authorization;
    const validToken = process.env.JWT_SECRET || 'alma-secret-token';
    
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

app.put('/api/materials/:id', async (req, res) => {
    const { name, quantity, unit, cost } = req.body;
    try {
        const result = await pool.query(
            'UPDATE materials SET name=$1, quantity=$2, unit=$3, cost=$4 WHERE id=$5 RETURNING *',
            [name, quantity, unit, cost, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/materials/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM materials WHERE id=$1', [req.params.id]);
        res.status(204).send();
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
const mapStock = (row) => ({
    id: row.id,
    name: row.piece_name,
    quantity: row.quantity,
    cost: row.cost ?? 0,
    price: row.price
});

app.get('/api/stock', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM stock ORDER BY id ASC');
        res.json(result.rows.map(mapStock));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/stock', async (req, res) => {
    const { name, quantity, cost, price } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO stock (piece_name, quantity, cost, price) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, quantity, cost ?? 0, price]
        );
        res.json(mapStock(result.rows[0]));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/stock/:id', async (req, res) => {
    const { name, quantity, cost, price } = req.body;
    try {
        const result = await pool.query(
            'UPDATE stock SET piece_name=$1, quantity=$2, cost=$3, price=$4 WHERE id=$5 RETURNING *',
            [name, quantity, cost ?? 0, price, req.params.id]
        );
        res.json(mapStock(result.rows[0]));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/stock/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM stock WHERE id=$1', [req.params.id]);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ---- PRODUCTION LOGS API ----
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

app.delete('/api/production_logs/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM production_logs WHERE id=$1', [req.params.id]);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
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

// ---- PRODUCTS API ----
app.get('/api/products', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products WHERE active = true ORDER BY created_at DESC');
        res.json(result.rows.map(r => ({ ...r, images: Array.isArray(r.images) ? r.images : [] })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/products/all', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
        res.json(result.rows.map(r => ({ ...r, images: Array.isArray(r.images) ? r.images : [] })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/products', async (req, res) => {
    const { name, description, price, images, whatsapp_message } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO products (name, description, price, images, whatsapp_message) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, description, price, JSON.stringify(images || []), whatsapp_message || '']
        );
        const r = result.rows[0];
        res.status(201).json({ ...r, images: Array.isArray(r.images) ? r.images : [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/products/:id', async (req, res) => {
    const { name, description, price, images, whatsapp_message, active } = req.body;
    try {
        const result = await pool.query(
            'UPDATE products SET name=$1, description=$2, price=$3, images=$4, whatsapp_message=$5, active=$6 WHERE id=$7 RETURNING *',
            [name, description, price, JSON.stringify(images || []), whatsapp_message || '', active, req.params.id]
        );
        const r = result.rows[0];
        res.json({ ...r, images: Array.isArray(r.images) ? r.images : [] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM products WHERE id=$1', [req.params.id]);
        res.status(204).send();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ---- AI MATERIAL SCANNER (Groq) ----
app.post('/api/analyze-material-image', async (req, res) => {
    const { images } = req.body;
    if (!images || !images.length) return res.status(400).json({ error: 'Nenhuma imagem enviada' });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY não configurada' });

    try {
        const groq = new Groq({ apiKey });

        const imageContents = images.map(img => ({
            type: 'image_url',
            image_url: { url: `data:${img.mediaType || 'image/jpeg'};base64,${img.base64}` }
        }));

        const completion = await groq.chat.completions.create({
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            max_tokens: 512,
            messages: [{
                role: 'user',
                content: [
                    ...imageContents,
                    {
                        type: 'text',
                        text: `Analise ${images.length > 1 ? 'estas ' + images.length + ' imagens do mesmo novelo/fio (frente, verso e laterais da embalagem)' : 'esta imagem de novelo/fio'}. Use todas as fotos juntas para extrair as informações mais completas possíveis. Retorne SOMENTE um JSON válido sem markdown: {"name": "nome completo do fio com cor e marca", "cost": null, "unit": "metros ou gramas ou novelo", "quantity": quantidade_numerica}. Para "unit": prefira "metros" se houver metragem visível em qualquer foto, "gramas" se só gramagem, "novelo" se nenhum. Para "cost" use sempre null. Para "quantity" use 1 se não encontrar. Responda APENAS com o JSON.`
                    }
                ]
            }]
        });

        const text = completion.choices[0].message.content.trim();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const data = JSON.parse(jsonMatch ? jsonMatch[0] : text);
        res.json(data);
    } catch (err) {
        console.error('Error analyzing image:', err);
        res.status(500).json({ error: 'Erro ao analisar imagem: ' + err.message });
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
