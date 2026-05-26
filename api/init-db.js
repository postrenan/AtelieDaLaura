import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: process.env.POSTGRES_URL && process.env.POSTGRES_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDb() {
    console.log("Creating tables...");
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(`
            CREATE TABLE IF NOT EXISTS finances (
                id SERIAL PRIMARY KEY,
                type VARCHAR(50) NOT NULL,
                description TEXT NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS materials (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                quantity DECIMAL(10, 2) NOT NULL,
                unit VARCHAR(50) NOT NULL,
                cost DECIMAL(10, 2) NOT NULL
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                client_name VARCHAR(255) NOT NULL,
                piece_details TEXT NOT NULL,
                delivery_date DATE,
                status VARCHAR(50) DEFAULT 'pendente',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS stock (
                id SERIAL PRIMARY KEY,
                piece_name VARCHAR(255) NOT NULL,
                quantity INTEGER NOT NULL,
                price DECIMAL(10, 2) NOT NULL
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS production_logs (
                id SERIAL PRIMARY KEY,
                piece_name VARCHAR(255) NOT NULL,
                hours_spent DECIMAL(10, 2) NOT NULL,
                materials_used JSONB,
                linked_order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS feedbacks (
                id SERIAL PRIMARY KEY,
                client_name VARCHAR(255) NOT NULL,
                message TEXT NOT NULL,
                rating INTEGER NOT NULL,
                date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log("Tables created successfully.");

        // Migration from data.json if exists
        const dataPath = path.join(__dirname, '..', 'data.json');
        if (fs.existsSync(dataPath)) {
            console.log("data.json found, starting migration...");
            const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

            if (data.finances && data.finances.length > 0) {
                for (const f of data.finances) {
                    await client.query('INSERT INTO finances (type, description, amount, date) VALUES ($1, $2, $3, $4)', [f.type, f.description, f.amount, f.date]);
                }
                console.log(\`Migrated \${data.finances.length} finances.\`);
            }

            if (data.materials && data.materials.length > 0) {
                for (const m of data.materials) {
                    // id constraint might conflict if we let SERIAL handle it, but we'll insert raw values and reset sequence if needed. 
                    // Better to just insert and let PG generate IDs, but relations matter. 
                    // Since materials_used in logs refer to materialId, we should ideally keep the IDs or map them.
                    // For simplicity, we just insert. A robust migration would map IDs.
                    await client.query('INSERT INTO materials (id, name, quantity, unit, cost) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING', [m.id, m.name, m.quantity, m.unit, m.cost]);
                }
                await client.query("SELECT setval('materials_id_seq', (SELECT MAX(id) FROM materials));");
                console.log(\`Migrated \${data.materials.length} materials.\`);
            }

            if (data.orders && data.orders.length > 0) {
                for (const o of data.orders) {
                    await client.query('INSERT INTO orders (id, client_name, piece_details, delivery_date, status, created_at) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING', [o.id, o.clientName, o.pieceDetails, o.deliveryDate || null, o.status, o.createdAt || new Date()]);
                }
                await client.query("SELECT setval('orders_id_seq', (SELECT MAX(id) FROM orders));");
                console.log(\`Migrated \${data.orders.length} orders.\`);
            }
            
            if (data.stock && data.stock.length > 0) {
                for (const s of data.stock) {
                    await client.query('INSERT INTO stock (id, piece_name, quantity, price) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING', [s.id, s.pieceName, s.quantity, s.price]);
                }
                await client.query("SELECT setval('stock_id_seq', (SELECT MAX(id) FROM stock));");
                console.log(\`Migrated \${data.stock.length} stock items.\`);
            }

            if (data.feedbacks && data.feedbacks.length > 0) {
                for (const fb of data.feedbacks) {
                    await client.query('INSERT INTO feedbacks (id, client_name, message, rating, date) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING', [fb.id, fb.clientName || 'Anônimo', fb.message, fb.rating, fb.date || new Date()]);
                }
                await client.query("SELECT setval('feedbacks_id_seq', (SELECT MAX(id) FROM feedbacks));");
                console.log(\`Migrated \${data.feedbacks.length} feedbacks.\`);
            }

            if (data.production_logs && data.production_logs.length > 0) {
                for (const pl of data.production_logs) {
                    await client.query('INSERT INTO production_logs (id, piece_name, hours_spent, materials_used, linked_order_id, date) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING', [pl.id, pl.pieceName, pl.hoursSpent, JSON.stringify(pl.materialsUsed || []), pl.linkedOrderId || null, pl.date || new Date()]);
                }
                await client.query("SELECT setval('production_logs_id_seq', (SELECT MAX(id) FROM production_logs));");
                console.log(\`Migrated \${data.production_logs.length} production logs.\`);
            }

            console.log("Migration from data.json completed!");
        }

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Error creating tables or migrating data:", e);
    } finally {
        client.release();
        pool.end();
    }
}

if (!process.env.POSTGRES_URL) {
    console.error("Missing POSTGRES_URL environment variable.");
    process.exit(1);
}

initDb();
