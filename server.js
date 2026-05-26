import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());

// Initialize data.json if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
        finances: [],
        materials: [],
        production: []
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
}

// Helper to read data
function readData() {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(data);
    let updated = false;
    if (!parsed.orders) {
        parsed.orders = [];
        updated = true;
    }
    if (!parsed.stock) {
        parsed.stock = [];
        updated = true;
    }
    if (!parsed.production_logs) {
        parsed.production_logs = [];
        updated = true;
    }
    if (!parsed.feedbacks) {
        parsed.feedbacks = [];
        updated = true;
    }
    if (updated) {
        writeData(parsed);
    }
    return parsed;
}

// Helper to write data
function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ---- AUTHENTICATION ----
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'laura123') {
        res.json({ token: 'atelie-secret-token' });
    } else {
        res.status(401).json({ error: 'Credenciais inválidas' });
    }
});

// Auth Middleware for protected routes
app.use('/api', (req, res, next) => {
    // Public routes that don't need auth
    if (req.path === '/login') return next();
    if (req.path === '/feedbacks' && req.method === 'GET') return next();

    const authHeader = req.headers.authorization;
    if (authHeader === 'Bearer atelie-secret-token') {
        next();
    } else {
        res.status(401).json({ error: 'Não autorizado' });
    }
});

// ---- FINANCES API ----
app.get('/api/finances', (req, res) => {
    const data = readData();
    res.json(data.finances);
});

app.post('/api/finances', (req, res) => {
    const data = readData();
    const newEntry = { id: Date.now(), ...req.body, date: req.body.date || new Date().toISOString() };
    data.finances.push(newEntry);
    writeData(data);
    res.json(newEntry);
});

// ---- MATERIALS API ----
app.get('/api/materials', (req, res) => {
    const data = readData();
    res.json(data.materials);
});

app.post('/api/materials', (req, res) => {
    const data = readData();
    const newMaterial = { id: Date.now(), ...req.body };
    data.materials.push(newMaterial);
    writeData(data);
    res.json(newMaterial);
});

// ---- PRODUCTION API ----
app.get('/api/production', (req, res) => {
    const data = readData();
    res.json(data.production);
});

app.post('/api/production', (req, res) => {
    const data = readData();
    const newProduction = { id: Date.now(), ...req.body, date: new Date().toISOString() };
    data.production.push(newProduction);
    writeData(data);
    res.json(newProduction);
});

// ---- ORDERS API ----
app.get('/api/orders', (req, res) => {
    const data = readData();
    res.json(data.orders);
});

app.post('/api/orders', (req, res) => {
    const data = readData();
    const newOrder = { id: Date.now(), ...req.body, status: req.body.status || 'pendente', createdAt: new Date().toISOString() };
    data.orders.push(newOrder);
    writeData(data);
    res.json(newOrder);
});

// ---- STOCK API ----
app.get('/api/stock', (req, res) => {
    const data = readData();
    res.json(data.stock);
});

app.post('/api/stock', (req, res) => {
    const data = readData();
    const newItem = { id: Date.now(), ...req.body };
    data.stock.push(newItem);
    writeData(data);
    res.json(newItem);
});

// ---- PRODUCTION LOGS API (Strava) ----
app.get('/api/production_logs', (req, res) => {
    const data = readData();
    res.json(data.production_logs);
});

app.post('/api/production_logs', (req, res) => {
    const data = readData();
    const { pieceName, hoursSpent, materialsUsed, linkedOrderId } = req.body;
    
    // 1. Deduct materials
    if (materialsUsed && materialsUsed.length > 0) {
        materialsUsed.forEach(mu => {
            const mat = data.materials.find(m => m.id === mu.materialId);
            if (mat) {
                mat.quantity = Number(mat.quantity) - Number(mu.quantityUsed);
            }
        });
    }

    // 2. Update order if linked
    if (linkedOrderId) {
        const order = data.orders.find(o => o.id === linkedOrderId);
        if (order) {
            order.status = 'concluído';
        }
    }

    // 3. Save log
    const newLog = { 
        id: Date.now(), 
        pieceName, 
        hoursSpent: Number(hoursSpent), 
        materialsUsed: materialsUsed || [], 
        linkedOrderId,
        date: new Date().toISOString()
    };
    data.production_logs.push(newLog);
    writeData(data);
    res.json(newLog);
});

// ---- FEEDBACKS API ----
app.get('/api/feedbacks', (req, res) => {
    const data = readData();
    res.json(data.feedbacks);
});

app.post('/api/feedbacks', (req, res) => {
    const data = readData();
    const newFeedback = { id: Date.now(), ...req.body, date: new Date().toISOString() };
    data.feedbacks.push(newFeedback);
    writeData(data);
    res.json(newFeedback);
});

app.listen(PORT, () => {
    console.log(`JSON Server running on http://localhost:${PORT}`);
});
