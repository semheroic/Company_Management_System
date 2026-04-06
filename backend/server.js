const express = require('express'), mysql = require('mysql2'), cors = require('cors'), 
      dotenv = require('dotenv'), multer = require('multer'), fs = require('fs'), 
      fsPromises = fs.promises, path = require('path');

dotenv.config();
const app = express(), PORT = process.env.PORT || 5000;

app.use(cors()); app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

const db = mysql.createPool({
    host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, 
    database: process.env.DB_NAME, waitForConnections: true, connectionLimit: 10
}).promise();

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const safeDelete = async (path) => { if (path) try { await fsPromises.unlink(path); } catch {} };
const normalizePath = (p) => p ? p.replace(/\\/g, '/') : null;

// Middleware: Validate Active Company
const validateCompany = async (req, res, next) => {
    const id = req.headers['x-company-id'] || req.params.companyId || req.params.id;
    if (!id) return next();
    try {
        const [rows] = await db.query('SELECT id, status FROM companies WHERE id = ?', [id]);
        if (!rows.length || rows[0].status !== 'active') {
            if (req.file) await safeDelete(req.file.path);
            return res.status(rows.length ? 403 : 404).json({ error: rows.length ? 'Company inactive' : 'Company not found' });
        }
        req.companyId = parseInt(id); next();
    } catch (err) { res.status(500).json({ error: 'DB Error' }); }
};

// --- COMPANY ROUTES ---
app.get('/api/companies', async (req, res) => {
    const [rows] = await db.query('SELECT * FROM companies ORDER BY created_at DESC');
    res.json(rows);
});

app.post('/api/company', async (req, res) => {
    try {
        const [reslt] = await db.query(`INSERT INTO companies SET ?, status = 'active'`, [req.body]);
        const [[rows]] = await db.query('SELECT * FROM companies WHERE id = ?', [reslt.insertId]);
        res.status(201).json(rows);
    } catch (err) { res.status(400).json({ error: err.code === 'ER_DUP_ENTRY' ? 'TIN exists' : 'Failed' }); }
});

app.get('/api/company/:id', validateCompany, async (req, res) => {
    const [[rows]] = await db.query('SELECT * FROM companies WHERE id = ?', [req.companyId]);
    res.json(rows);
});

app.put('/api/company/:id', validateCompany, async (req, res) => {
    await db.query('UPDATE companies SET ?, updated_at = NOW() WHERE id = ?', [req.body, req.companyId]);
    const [[rows]] = await db.query('SELECT * FROM companies WHERE id = ?', [req.companyId]);
    res.json(rows);
});

// --- MEMBER ROUTES ---
app.get('/api/company/:companyId/members', validateCompany, async (req, res) => {
    const [rows] = await db.query('SELECT * FROM company_members WHERE company_id = ?', [req.companyId]);
    res.json(rows);
});

app.post('/api/company/:companyId/members', upload.single('file'), validateCompany, async (req, res) => {
    try {
        const memberData = { 
            ...req.body, 
            company_id: req.companyId, 
            document_path: normalizePath(req.file?.path),
            join_date: req.body.join_date || new Date().toISOString().split('T')[0],
            status: req.body.status || 'Active'
        };

        const [result] = await db.query('INSERT INTO company_members SET ?', [memberData]);
        const [[row]] = await db.query('SELECT * FROM company_members WHERE id = ?', [result.insertId]);
        res.status(201).json(row);
    } catch (err) {
        if (req.file) await safeDelete(req.file.path);
        res.status(400).json({ error: 'Failed to add member' });
    }
});
app.put('/api/company/:companyId/members/:memberId', upload.single('file'), validateCompany, async (req, res) => {
    try {
        const { memberId } = req.params;
        
        // 1. Check if member exists and get old file path
        const [[oldMember]] = await db.query('SELECT document_path FROM company_members WHERE id = ? AND company_id = ?', [memberId, req.companyId]);
        if (!oldMember) return res.status(404).json({ error: 'Member not found' });

        // 2. Prepare update data (Keep old file if no new one is uploaded)
        const updateData = { 
            ...req.body, 
            document_path: req.file ? normalizePath(req.file.path) : oldMember.document_path,
            // Ensure status and join_date are preserved if not in body
            status: req.body.status || 'Active'
        };

        // 3. Execute Update
        await db.query('UPDATE company_members SET ? WHERE id = ?', [updateData, memberId]);

        // 4. Cleanup: Delete old file if a new one was successfully uploaded
        if (req.file && oldMember.document_path) await safeDelete(oldMember.document_path);

        const [[updatedRow]] = await db.query('SELECT * FROM company_members WHERE id = ?', [memberId]);
        res.json(updatedRow);
    } catch (err) {
        if (req.file) await safeDelete(req.file.path);
        console.error(err);
        res.status(400).json({ error: 'Update failed' });
    }
});
app.delete('/api/company/:companyId/members/:memberId', validateCompany, async (req, res) => {
    const [[member]] = await db.query('SELECT document_path FROM company_members WHERE id = ? AND company_id = ?', [req.params.memberId, req.companyId]);
    if (!member) return res.status(404).json({ error: 'Not found' });
    await db.query('DELETE FROM company_members WHERE id = ?', [req.params.memberId]);
    await safeDelete(member.document_path);
    res.json({ success: true });
});

// --- SHARE TRANSFER ---
app.post('/api/company/:companyId/shares/transfer', validateCompany, async (req, res) => {
    const { fromMemberId, toMemberId, amount, notes, date } = req.body;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [[sender]] = await conn.query('SELECT shares_held FROM company_members WHERE id=? AND company_id=? FOR UPDATE', [fromMemberId, req.companyId]);
        
        if (!sender || sender.shares_held < amount) throw new Error('Insufficient shares');

        await conn.query('UPDATE company_members SET shares_held = shares_held - ? WHERE id=?', [amount, fromMemberId]);
        await conn.query('UPDATE company_members SET shares_held = shares_held + ? WHERE id=?', [amount, toMemberId]);
        await conn.query('INSERT INTO share_transfer SET ?', { 
            company_id: req.companyId, from_member_id: fromMemberId, to_member_id: toMemberId, 
            shares_amount: amount, transaction_date: date || new Date().toISOString().split('T')[0], notes 
        });

        await conn.commit();
        res.json({ success: true });
    } catch (err) {
        await conn.rollback();
        res.status(400).json({ error: err.message });
    } finally { conn.release(); }
});

app.get('/api/company/:companyId/shares/history', validateCompany, async (req, res) => {
    const [rows] = await db.query(`
        SELECT t.*, m1.name as from_member_name, m2.name as to_member_name 
        FROM share_transfer t 
        LEFT JOIN company_members m1 ON t.from_member_id = m1.id 
        LEFT JOIN company_members m2 ON t.to_member_id = m2.id 
        WHERE t.company_id = ? ORDER BY t.created_at DESC`, [req.companyId]);
    res.json(rows);
});

app.delete('/api/company/:companyId/shares/:txnId', validateCompany, async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [[t]] = await conn.query('SELECT * FROM share_transfer WHERE id = ?', [req.params.txnId]);
        if (!t) throw new Error('Not found');

        await conn.query('UPDATE company_members SET shares_held = shares_held + ? WHERE id = ?', [t.shares_amount, t.from_member_id]);
        await conn.query('UPDATE company_members SET shares_held = shares_held - ? WHERE id = ?', [t.shares_amount, t.to_member_id]);
        await conn.query('DELETE FROM share_transfer WHERE id = ?', [req.params.txnId]);
        
        await conn.commit(); res.json({ success: true });
    } catch (err) { await conn.rollback(); res.status(400).json({ error: err.message }); } 
    finally { conn.release(); }
});
app.put('/api/company/:companyId/shares/:txnId', validateCompany, async (req, res) => {
    const { amount, notes, date } = req.body;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [[t]] = await conn.query('SELECT * FROM share_transfer WHERE id = ? FOR UPDATE', [req.params.txnId]);
        if (!t) throw new Error('Transaction not found');

        // 1. Reverse old balances
        await conn.query('UPDATE company_members SET shares_held = shares_held + ? WHERE id = ?', [t.shares_amount, t.from_member_id]);
        await conn.query('UPDATE company_members SET shares_held = shares_held - ? WHERE id = ?', [t.shares_amount, t.to_member_id]);

        // 2. Check if sender has enough for the NEW amount
        const [[sender]] = await conn.query('SELECT shares_held FROM company_members WHERE id = ?', [t.from_member_id]);
        if (sender.shares_held < amount) throw new Error('Insufficient shares for updated amount');

        // 3. Apply new balances
        await conn.query('UPDATE company_members SET shares_held = shares_held - ? WHERE id = ?', [amount, t.from_member_id]);
        await conn.query('UPDATE company_members SET shares_held = shares_held + ? WHERE id = ?', [amount, t.to_member_id]);

        // 4. Update the transfer record
        await conn.query('UPDATE share_transfer SET shares_amount=?, notes=?, transaction_date=? WHERE id=?', 
            [amount, notes, date || t.transaction_date, req.params.txnId]);

        await conn.commit();
        res.json({ success: true });
    } catch (err) {
        await conn.rollback();
        res.status(400).json({ error: err.message });
    } finally { conn.release(); }
});
// --- DOCUMENTS ---
app.post('/api/company/:companyId/upload', upload.single('file'), validateCompany, async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const [reslt] = await db.query('INSERT INTO company_documents SET ?', { company_id: req.companyId, name: req.file.originalname, file_path: normalizePath(req.file.path) });
    const [[doc]] = await db.query('SELECT * FROM company_documents WHERE id = ?', [reslt.insertId]);
    res.status(201).json(doc);
});

app.use(async (err, req, res, next) => {
    if (req.file) await safeDelete(req.file.path);
    res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => console.log(`🚀 http://localhost:${PORT}`));