const express = require('express'),
    mysql = require('mysql2'),
    cors = require('cors'),
    dotenv = require('dotenv'),
    multer = require('multer'),
    fs = require('fs'),
    fsPromises = fs.promises,
    path = require('path');

dotenv.config();
const app = express(), PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

// --- 1. ERROR HANDLING UTILITIES ---

class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// --- 2. DATABASE CONNECTION ---

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
}).promise();

db.getConnection()
    .then(conn => { console.log('✅ DB Connected'); conn.release(); })
    .catch(err => { console.error('❌ DB Connection Error:', err.message); process.exit(1); });

// --- 3. FILE UPLOADS & UTILS ---

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const safeDelete = async (filePath) => { if (filePath) try { await fsPromises.unlink(filePath); } catch { } };
const normalizePath = (p) => p ? p.replace(/\\/g, '/') : null;
const DEFAULT_ACCOUNTS = [
    { code: '1001', name: 'Cash at Bank', category: 'asset' },
    { code: '1002', name: 'Petty Cash', category: 'asset' },
    { code: '1003', name: 'Mobile Money Account', category: 'asset' },
    { code: '1101', name: 'Accounts Receivable', category: 'asset' },
    { code: '1201', name: 'Inventory', category: 'asset' },
    { code: '1301', name: 'Fixed Assets', category: 'asset' },
    { code: '1302', name: 'Accumulated Depreciation', category: 'asset' },
    { code: '2001', name: 'Accounts Payable', category: 'liability' },
    { code: '2101', name: 'VAT Payable', category: 'liability' },
    { code: '2102', name: 'PAYE Payable', category: 'liability' },
    { code: '2103', name: 'RSSB Payable', category: 'liability' },
    { code: '2104', name: 'Dividend Payable', category: 'liability' },
    { code: '2201', name: 'Accrued Expenses', category: 'liability' },
    { code: '3000', name: 'Share Capital', category: 'equity' },
    { code: '3001', name: 'Retained Earnings', category: 'equity' },
    { code: '3002', name: 'Owner Drawings', category: 'equity' },
    { code: '3003', name: 'Equity Adjustment', category: 'equity' },
    { code: '4001', name: 'Sales Revenue', category: 'revenue' },
    { code: '4002', name: 'Service Revenue', category: 'revenue' },
    { code: '4003', name: 'Other Income', category: 'revenue' },
    { code: '5001', name: 'General Expenses', category: 'expense' },
    { code: '5002', name: 'Salaries & Wages', category: 'expense' },
    { code: '5003', name: 'Rent Expense', category: 'expense' },
    { code: '5004', name: 'Utilities Expense', category: 'expense' },
    { code: '5005', name: 'Office Supplies', category: 'expense' },
    { code: '5006', name: 'Professional Fees', category: 'expense' },
    { code: '5007', name: 'Depreciation Expense', category: 'expense' },
    { code: '5008', name: 'Other Expenses', category: 'expense' }
];

const inferAccountCategory = (code = '') => {
    const prefix = String(code)[0];
    switch (prefix) {
        case '1': return 'asset';
        case '2': return 'liability';
        case '3': return 'equity';
        case '4': return 'revenue';
        case '5': return 'expense';
        default: return 'other';
    }
};

const buildJournalReference = (journalId, referenceNo) => referenceNo || `JE-${String(journalId).padStart(6, '0')}`;

const ensureDefaultAccounts = async (companyId, conn = db) => {
    for (const account of DEFAULT_ACCOUNTS) {
        const [rows] = await conn.query(
            'SELECT id FROM accounts WHERE company_id = ? AND code = ? LIMIT 1',
            [companyId, account.code]
        );

        if (!rows.length) {
            await conn.query('INSERT INTO accounts SET ?', {
                company_id: companyId,
                code: account.code,
                name: account.name,
                category: account.category,
                is_active: 1
            });
        }
    }
};

const ensureAccountByCode = async (companyId, account, conn = db) => {
    const code = String(account.account_code || account.code || '').trim();
    if (!code) throw new AppError('Account code is required', 400);

    const [rows] = await conn.query(
        'SELECT id, code, name, category FROM accounts WHERE company_id = ? AND code = ? LIMIT 1',
        [companyId, code]
    );

    if (rows.length) {
        return rows[0];
    }

    const newAccount = {
        company_id: companyId,
        code,
        name: (account.account_name || account.name || `Account ${code}`).trim(),
        category: inferAccountCategory(code),
        is_active: 1
    };

    const [result] = await conn.query('INSERT INTO accounts SET ?', newAccount);
    return { id: result.insertId, code: newAccount.code, name: newAccount.name, category: newAccount.category };
};

const generateInvoiceNumber = (type) => {
    const year = new Date().getFullYear();
    const prefix = type === 'invoice' ? 'INV' : 'REC';
    return `${prefix}-${year}-${Date.now()}`;
};

// --- 4. MIDDLEWARE ---

// --- 4. MIDDLEWARE ---

const validateCompany = asyncHandler(async (req, res, next) => {
    // Check Headers, URL Params, AND Request Body
    const id = 
        req.headers['x-company-id'] || 
        req.params.companyId || 
        req.params.id || 
        req.body.company_id; // Added this check

    if (!id) {
        // If no ID is provided at all, we can't validate, 
        // so we move on or throw an error based on your needs.
        return next(); 
    }

    const [rows] = await db.query('SELECT id, status FROM companies WHERE id = ?', [id]);

    if (!rows.length) throw new AppError('Company not found', 404);
    if (rows[0].status !== 'active') throw new AppError('Company is inactive', 403);

    req.companyId = parseInt(id);
    next();
});

// --- 5. ROUTES ---

// --- COMPANY ROUTES ---
app.get('/api/companies', asyncHandler(async (req, res) => {
    const [rows] = await db.query('SELECT * FROM companies ORDER BY created_at DESC');
    res.json(rows);
}));

app.post('/api/company', asyncHandler(async (req, res) => {
    if (req.body.name) req.body.name = req.body.name.trim();
    const [result] = await db.query(`INSERT INTO companies SET ?, status = 'active'`, [req.body]);
    const [[company]] = await db.query('SELECT * FROM companies WHERE id = ?', [result.insertId]);
    res.status(201).json(company);
}));

app.get('/api/company/:id', validateCompany, asyncHandler(async (req, res) => {
    const [[company]] = await db.query('SELECT * FROM companies WHERE id = ?', [req.companyId]);
    res.json(company);
}));

app.put('/api/company/:id', validateCompany, asyncHandler(async (req, res) => {
    await db.query('UPDATE companies SET ?, updated_at = NOW() WHERE id = ?', [req.body, req.companyId]);
    const [[company]] = await db.query('SELECT * FROM companies WHERE id = ?', [req.companyId]);
    res.json(company);
}));

// --- MEMBER ROUTES (UNIFIED REGISTRY) ---
app.get('/api/company/:companyId/members', validateCompany, asyncHandler(async (req, res) => {
    const [rows] = await db.query('SELECT * FROM company_members WHERE company_id = ?', [req.companyId]);
    res.json(rows);
}));

app.post('/api/company/:companyId/members', upload.single('file'), validateCompany, asyncHandler(async (req, res) => {
    const memberData = {
        ...req.body,
        company_id: req.companyId,
        document_path: normalizePath(req.file?.path),
        join_date: req.body.join_date || new Date().toISOString().split('T')[0],
        status: req.body.status || 'Active'
    };
    const [result] = await db.query('INSERT INTO company_members SET ?', [memberData]);
    const [[member]] = await db.query('SELECT * FROM company_members WHERE id = ?', [result.insertId]);
    res.status(201).json(member);
}));

app.put('/api/company/:companyId/members/:memberId', upload.single('file'), validateCompany, asyncHandler(async (req, res) => {
    const { memberId } = req.params;
    const [[oldMember]] = await db.query('SELECT document_path FROM company_members WHERE id = ? AND company_id = ?', [memberId, req.companyId]);
    if (!oldMember) throw new AppError('Member not found', 404);

    const updateData = {
        ...req.body,
        document_path: req.file ? normalizePath(req.file.path) : oldMember.document_path,
        status: req.body.status || 'Active'
    };
    await db.query('UPDATE company_members SET ? WHERE id = ?', [updateData, memberId]);
    if (req.file && oldMember.document_path) await safeDelete(oldMember.document_path);
    const [[updatedMember]] = await db.query('SELECT * FROM company_members WHERE id = ?', [memberId]);
    res.json(updatedMember);
}));

app.delete('/api/company/:companyId/members/:memberId', validateCompany, asyncHandler(async (req, res) => {
    const [[member]] = await db.query('SELECT document_path FROM company_members WHERE id = ? AND company_id = ?', [req.params.memberId, req.companyId]);
    if (!member) throw new AppError('Member not found', 404);
    await db.query('DELETE FROM company_members WHERE id = ?', [req.params.memberId]);
    await safeDelete(member.document_path);
    res.json({ success: true, message: 'Member deleted successfully' });
}));

// --- CAPITAL STRUCTURE & SHAREHOLDERS ---

// GET Shareholders (Members with shares > 0)
app.get('/api/company/:companyId/shareholders', validateCompany, asyncHandler(async (req, res) => {
    const [shareholders] = await db.query(
        'SELECT *, (shares_held / (SELECT SUM(shares_held) FROM company_members WHERE company_id = ?)) * 100 as share_percentage FROM company_members WHERE company_id = ? AND shares_held > 0',
        [req.companyId, req.companyId]
    );
    res.json(shareholders);
}));

app.get('/api/company/:companyId/capital-structure', validateCompany, asyncHandler(async (req, res) => {
    const [[structure]] = await db.query('SELECT * FROM company_capital_structure WHERE company_id = ?', [req.companyId]);
    if (!structure) throw new AppError('Capital structure not initialized', 404);
    res.json(structure);
}));

app.post('/api/company/:companyId/capital-structure', validateCompany, asyncHandler(async (req, res) => {
    const { authorized_shares, share_price, currency, capital_type } = req.body;
    await db.query(`
        INSERT INTO company_capital_structure (company_id, authorized_shares, share_price, currency, capital_type)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            authorized_shares = VALUES(authorized_shares), share_price = VALUES(share_price), 
            currency = VALUES(currency), capital_type = VALUES(capital_type), updated_at = NOW()
    `, [req.companyId, authorized_shares, share_price, currency || 'RWF', capital_type || 'ordinary']);
    const [[updated]] = await db.query('SELECT * FROM company_capital_structure WHERE company_id = ?', [req.companyId]);
    res.json(updated);
}));

// --- CAPITAL ENTRIES / LEDGER ---
app.get('/api/company/:companyId/capital-entries', validateCompany, asyncHandler(async (req, res) => {
    const [entries] = await db.query(
        'SELECT c.*, m.name as shareholder_name FROM capital_entries c LEFT JOIN company_members m ON c.shareholder_id = m.id WHERE c.company_id = ? ORDER BY c.created_at DESC',
        [req.companyId]
    );
    res.json(entries);
}));

app.get('/api/company/:companyId/capital/ledger', validateCompany, asyncHandler(async (req, res) => {
    const [rows] = await db.query(`
        SELECT c.*, m.name as shareholder_name FROM capital_entries c
        JOIN company_members m ON c.shareholder_id = m.id
        WHERE c.company_id = ? ORDER BY c.date_contributed DESC`, [req.companyId]);
    res.json(rows);
}));

app.post('/api/company/:companyId/capital/entry', upload.single('file'), validateCompany, asyncHandler(async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const amount = Number(req.body.amount || 0);
        const sharesAllocated = Number(req.body.shares_allocated || 0);

        const entryData = {
            company_id: req.companyId, shareholder_id: req.body.shareholder_id,
            amount, date_contributed: req.body.date_contributed,
            method: req.body.method, description: req.body.description,
            entry_type: req.body.entry_type, status: req.body.status || 'pending',
            file_url: normalizePath(req.file?.path), created_by: req.body.created_by || 'System'
        };

        if (!entryData.shareholder_id) throw new AppError('Shareholder is required', 400);
        if (!amount || Number.isNaN(amount) || amount <= 0) throw new AppError('Amount must be greater than zero', 400);

        const [[member]] = await conn.query(
            'SELECT id, shares_held FROM company_members WHERE id = ? AND company_id = ? FOR UPDATE',
            [entryData.shareholder_id, req.companyId]
        );
        if (!member) throw new AppError('Shareholder not found', 404);

        const [result] = await conn.query('INSERT INTO capital_entries SET ?', [entryData]);
        if (entryData.status === 'confirmed') {
            const shareDelta = entryData.entry_type === 'contribution'
                ? sharesAllocated
                : entryData.entry_type === 'withdrawal'
                    ? -sharesAllocated
                    : 0;

            if (shareDelta < 0 && Number(member.shares_held || 0) < Math.abs(shareDelta)) {
                throw new AppError('Insufficient shares for withdrawal', 400);
            }

            if (shareDelta !== 0) {
                await conn.query(
                    'UPDATE company_members SET shares_held = shares_held + ? WHERE id = ? AND company_id = ?',
                    [shareDelta, entryData.shareholder_id, req.companyId]
                );
            }
        }
        await conn.commit();
        res.status(201).json({ success: true, id: result.insertId });
    } catch (err) { await conn.rollback(); throw err; } finally { conn.release(); }
}));

// --- BENEFICIAL OWNERS (FILTERED FROM MEMBERS) ---
app.get('/api/company/:companyId/beneficial-owners', validateCompany, asyncHandler(async (req, res) => {
    const [owners] = await db.query(
        'SELECT * FROM beneficial_owners WHERE company_id = ? ORDER BY ownership_percentage DESC, created_at DESC',
        [req.companyId]
    );

    if (owners.length) {
        return res.json(owners);
    }

    const [rows] = await db.query(`
        SELECT
            id,
            company_id,
            name AS full_name,
            nationality,
            national_id AS id_number,
            NULL AS date_of_birth,
            'direct_owner' AS relationship_to_company,
            (shares_held / NULLIF((SELECT SUM(shares_held) FROM company_members WHERE company_id = ?), 0)) * 100 AS ownership_percentage,
            (shares_held / NULLIF((SELECT SUM(shares_held) FROM company_members WHERE company_id = ?), 0)) * 100 AS control_percentage,
            CASE
                WHEN (shares_held / NULLIF((SELECT SUM(shares_held) FROM company_members WHERE company_id = ?), 0)) * 100 >= 25 THEN 1
                ELSE 0
            END AS has_significant_control,
            '' AS physical_address,
            'pending' AS verification_status,
            created_at,
            updated_at
        FROM company_members
        WHERE company_id = ? AND is_beneficial_owner = 1
        ORDER BY shares_held DESC
    `, [req.companyId, req.companyId, req.companyId, req.companyId]);
    res.json(rows);
}));

// POST/PUT/DELETE for dedicated beneficial_owners table (if you still use both)
app.post('/api/company/:companyId/beneficial-owners', validateCompany, asyncHandler(async (req, res) => {
    const boData = { ...req.body, company_id: req.companyId, control_nature: JSON.stringify(req.body.control_nature || []) };
    const [result] = await db.query('INSERT INTO beneficial_owners SET ?', [boData]);
    const [[newBo]] = await db.query('SELECT * FROM beneficial_owners WHERE id = ?', [result.insertId]);
    res.status(201).json(newBo);
}));

app.put('/api/company/:companyId/beneficial-owners/:id', validateCompany, asyncHandler(async (req, res) => {
    const updateData = { ...req.body, control_nature: req.body.control_nature ? JSON.stringify(req.body.control_nature) : undefined };
    await db.query('UPDATE beneficial_owners SET ? WHERE id = ? AND company_id = ?', [updateData, req.params.id, req.companyId]);
    res.json({ success: true });
}));

app.delete('/api/company/:companyId/beneficial-owners/:id', validateCompany, asyncHandler(async (req, res) => {
    const [docs] = await db.query('SELECT document_url FROM beneficial_owner_documents WHERE beneficial_owner_id = ?', [req.params.id]);
    for (const doc of docs) { await safeDelete(doc.document_url); }
    await db.query('DELETE FROM beneficial_owners WHERE id = ? AND company_id = ?', [req.params.id, req.companyId]);
    res.json({ success: true });
}));

// --- SHARE TRANSFERS ---
app.post('/api/company/:companyId/shares/transfer', validateCompany, asyncHandler(async (req, res) => {
    const { fromMemberId, toMemberId, amount, notes, date } = req.body;
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const [[sender]] = await conn.query('SELECT shares_held FROM company_members WHERE id=? AND company_id=? FOR UPDATE', [fromMemberId, req.companyId]);
        if (!sender || sender.shares_held < amount) throw new AppError('Insufficient shares', 400);

        await conn.query('UPDATE company_members SET shares_held = shares_held - ? WHERE id=?', [amount, fromMemberId]);
        await conn.query('UPDATE company_members SET shares_held = shares_held + ? WHERE id=?', [amount, toMemberId]);
        await conn.query('INSERT INTO share_transfer SET ?', {
            company_id: req.companyId, from_member_id: fromMemberId, to_member_id: toMemberId,
            shares_amount: amount, transaction_date: date || new Date().toISOString().split('T')[0], notes
        });
        await conn.commit();
        res.json({ success: true });
    } catch (err) { await conn.rollback(); throw err; } finally { conn.release(); }
}));

app.get('/api/company/:companyId/shares/history', validateCompany, asyncHandler(async (req, res) => {
    const [rows] = await db.query(`
        SELECT t.*, m1.name as from_member_name, m2.name as to_member_name 
        FROM share_transfer t 
        LEFT JOIN company_members m1 ON t.from_member_id = m1.id 
        LEFT JOIN company_members m2 ON t.to_member_id = m2.id 
        WHERE t.company_id = ? ORDER BY t.created_at DESC`, [req.companyId]);
    res.json(rows);
}));

// --- DOCUMENTS & MAPPINGS ---
app.post('/api/company/:companyId/upload', upload.single('file'), validateCompany, asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError('No file provided', 400);
    const [result] = await db.query('INSERT INTO company_documents SET ?', {
        company_id: req.companyId, name: req.file.originalname, file_path: normalizePath(req.file.path)
    });
    const [[doc]] = await db.query('SELECT * FROM company_documents WHERE id = ?', [result.insertId]);
    res.status(201).json(doc);
}));

app.get('/api/company/:companyId/ownership-mappings', validateCompany, asyncHandler(async (req, res) => {
    const [rows] = await db.query(`
        SELECT om.*, m.name as member_name, bo.name as beneficial_owner_name
        FROM ownership_mappings om
        JOIN company_members m ON om.member_id = m.id
        JOIN company_members bo ON om.beneficial_owner_id = bo.id
        WHERE om.company_id = ?`, [req.companyId]);
    res.json(rows);
}));

// --- FINANCIAL SUMMARY ---
app.get('/api/company/:companyId/capital/summary', validateCompany, asyncHandler(async (req, res) => {
    const [summary] = await db.query(`
        SELECT 
            SUM(CASE WHEN entry_type = 'contribution' AND status = 'confirmed' THEN amount ELSE 0 END) as total_contributions,
            SUM(CASE WHEN entry_type = 'withdrawal' AND status = 'confirmed' THEN amount ELSE 0 END) as total_withdrawals
        FROM capital_entries WHERE company_id = ?`, [req.companyId]);
    const totals = summary[0];
    res.json({
        total_capital: (totals.total_contributions || 0) - (totals.total_withdrawals || 0),
        total_contributions: totals.total_contributions || 0,
        total_withdrawals: totals.total_withdrawals || 0
    });
}));

// --- GLOBAL ERROR HANDLER ---
app.use(async (err, req, res, next) => {
    if (req.file) await safeDelete(req.file.path);
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    if (err.code === 'ER_DUP_ENTRY') { statusCode = 409; message = 'Unique record already exists.'; }
    else if (err.code === 'ER_BAD_FIELD_ERROR') { statusCode = 400; message = 'Invalid data field.'; }

    console.error(`[Error] ${statusCode} - ${err.message}`);
    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});
// --- MEETING MINUTES ROUTES ---

// GET All meetings for a company
app.get('/api/company/:companyId/meetings', validateCompany, asyncHandler(async (req, res) => {
    const [rows] = await db.query(
        'SELECT * FROM meeting_minutes WHERE company_id = ? ORDER BY date DESC, time DESC', 
        [req.companyId]
    );

    // Parse JSON strings back to arrays for the React frontend
    const meetings = rows.map(row => ({
        ...row,
        attendees: typeof row.attendees === 'string' ? JSON.parse(row.attendees) : row.attendees,
        agenda: typeof row.agenda === 'string' ? JSON.parse(row.agenda) : row.agenda,
        decisions: typeof row.decisions === 'string' ? JSON.parse(row.decisions) : row.decisions,
        action_items: typeof row.action_items === 'string' ? JSON.parse(row.action_items) : row.action_items
    }));

    res.json(meetings);
}));

// POST New Meeting
// --- UPDATED POST New Meeting ---
app.post('/api/company/:companyId/meetings', validateCompany, asyncHandler(async (req, res) => {
    const meetingData = {
        // Force the ID from the validated middleware/URL to prevent cross-company injection
        company_id: req.companyId, 
        title: req.body.title,
        type: req.body.type,
        date: req.body.date,
        time: req.body.time,
        location: req.body.location,
        chairperson: req.body.chairperson,
        secretary: req.body.secretary,
        discussions: req.body.discussions,
        status: req.body.status || 'Scheduled',
        next_meeting_date: req.body.next_meeting_date || null,
        // Ensure these are stringified for MariaDB
        attendees: JSON.stringify(req.body.attendees || []),
        agenda: JSON.stringify(req.body.agenda || []),
        decisions: JSON.stringify(req.body.decisions || []),
        action_items: JSON.stringify(req.body.action_items || []) 
    };

    const [result] = await db.query('INSERT INTO meeting_minutes SET ?', [meetingData]);
    const [[newMeeting]] = await db.query('SELECT * FROM meeting_minutes WHERE id = ?', [result.insertId]);
    
    res.status(201).json(newMeeting);
}));
// GET Meeting Statistics
app.get('/api/company/:companyId/meetings/stats', validateCompany, asyncHandler(async (req, res) => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    const [stats] = await db.query(`
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN status = 'Scheduled' THEN 1 ELSE 0 END) as scheduled,
            SUM(CASE WHEN YEAR(date) = ? THEN 1 ELSE 0 END) as thisYear,
            SUM(CASE WHEN YEAR(date) = ? AND MONTH(date) = ? THEN 1 ELSE 0 END) as thisMonth
        FROM meeting_minutes 
        WHERE company_id = ?
    `, [currentYear, currentYear, currentMonth, req.companyId]);

    res.json(stats[0]);
}));

// PUT Update Meeting
app.put('/api/company/:companyId/meetings/:id', validateCompany, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        title, type, date, time, location, chairperson, secretary,
        attendees, agenda, discussions, decisions, action_items,
        next_meeting_date, status
    } = req.body;

    const sql = `
      UPDATE meeting_minutes 
      SET 
        title = ?, type = ?, date = ?, time = ?, location = ?, 
        chairperson = ?, secretary = ?, attendees = ?, agenda = ?, 
        discussions = ?, decisions = ?, action_items = ?, 
        next_meeting_date = ?, status = ?
      WHERE id = ? AND company_id = ?
    `;

    const values = [
        title, type, date, time, location, chairperson, secretary,
        JSON.stringify(attendees || []),
        JSON.stringify(agenda || []),
        discussions,
        JSON.stringify(decisions || []),
        JSON.stringify(action_items || []),
        next_meeting_date || null,
        status,
        id,
        req.companyId // Taken from validateCompany middleware
    ];

    const [result] = await db.query(sql, values);

    if (result.affectedRows === 0) {
        throw new AppError('Meeting not found or does not belong to this company', 404);
    }

    res.json({ success: true, message: "Meeting updated successfully" });
}));

// DELETE Meeting
app.delete('/api/company/:companyId/meetings/:meetingId', validateCompany, asyncHandler(async (req, res) => {
    const { meetingId } = req.params;
    const [result] = await db.query('DELETE FROM meeting_minutes WHERE id = ? AND company_id = ?', [meetingId, req.companyId]);
    
    if (result.affectedRows === 0) throw new AppError('Meeting not found', 404);
    res.json({ success: true, message: 'Meeting deleted' });
}));
// ==========================================
// --- BUSINESS PLAN & STRATEGY ROUTES ---
// ==========================================

// GET All Business Plans
app.get('/api/company/:companyId/business-plans', validateCompany, asyncHandler(async (req, res) => {
    const [plans] = await db.query(
        'SELECT * FROM business_plans WHERE company_id = ? ORDER BY year DESC, version DESC', 
        [req.companyId]
    );
    res.json(plans);
}));

// GET Active Business Plan
app.get('/api/company/:companyId/business-plans/active', validateCompany, asyncHandler(async (req, res) => {
    const [[activePlan]] = await db.query(
        "SELECT * FROM business_plans WHERE company_id = ? AND status = 'active' LIMIT 1", 
        [req.companyId]
    );
    res.json(activePlan || null);
}));

// POST Create New Business Plan
app.post('/api/company/:companyId/business-plans', validateCompany, asyncHandler(async (req, res) => {
    const planData = {
        company_id: req.companyId,
        title: req.body.title,
        year: req.body.year,
        description: req.body.description,
        strategic_goals: req.body.strategic_goals,
        mission_statement: req.body.mission_statement,
        vision_statement: req.body.vision_statement,
        swot_analysis: req.body.swot_analysis,
        financial_projections: req.body.financial_projections,
        market_analysis: req.body.market_analysis,
        competitive_analysis: req.body.competitive_analysis,
        uploaded_by: req.body.uploaded_by || 'System',
        status: req.body.status || 'draft',
        version: 1
    };

    const [result] = await db.query('INSERT INTO business_plans SET ?', [planData]);
    const [[newPlan]] = await db.query('SELECT * FROM business_plans WHERE id = ?', [result.insertId]);
    
    res.status(201).json(newPlan);
}));

// PUT Update Business Plan (Changed :id to :planId)
app.put('/api/company/:companyId/business-plans/:planId', validateCompany, asyncHandler(async (req, res) => {
    const { planId } = req.params; // Using specific planId
    
    const updateData = { ...req.body };
    delete updateData.id;
    delete updateData.company_id;
    delete updateData.created_at;
    delete updateData.updated_at;
    delete updateData.version;

    const [result] = await db.query(
        'UPDATE business_plans SET ?, version = version + 1 WHERE id = ? AND company_id = ?', 
        [updateData, planId, req.companyId]
    );

    if (result.affectedRows === 0) {
        throw new AppError('Business plan not found or access denied', 404);
    }

    const [[updatedPlan]] = await db.query('SELECT * FROM business_plans WHERE id = ?', [planId]);
    res.json(updatedPlan);
}));

// PATCH Archive Business Plan
app.patch('/api/company/:companyId/business-plans/:planId/archive', validateCompany, asyncHandler(async (req, res) => {
    const { planId } = req.params;
    
    const [result] = await db.query(
        "UPDATE business_plans SET status = 'archived' WHERE id = ? AND company_id = ?", 
        [planId, req.companyId]
    );

    if (result.affectedRows === 0) throw new AppError('Business plan not found', 404);
    
    res.json({ success: true, message: 'Plan archived' });
}));

// PATCH Set Active Business Plan
app.patch('/api/company/:companyId/business-plans/:planId/active', validateCompany, asyncHandler(async (req, res) => {
    const { planId } = req.params;
    const conn = await db.getConnection();
    
    try {
        await conn.beginTransaction();
        
        // 1. Archive current active plans for this company
        await conn.query(
            "UPDATE business_plans SET status = 'archived' WHERE company_id = ? AND status = 'active'", 
            [req.companyId]
        );
        
        // 2. Set new plan to active
        const [result] = await conn.query(
            "UPDATE business_plans SET status = 'active' WHERE id = ? AND company_id = ?", 
            [planId, req.companyId]
        );

        if (result.affectedRows === 0) throw new AppError('Business plan not found', 404);

        await conn.commit();
        res.json({ success: true, message: 'Plan set to active' });
        
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}));

// DELETE Business Plan
app.delete('/api/company/:companyId/business-plans/:planId', validateCompany, asyncHandler(async (req, res) => {
    const { planId } = req.params;
    const [result] = await db.query('DELETE FROM business_plans WHERE id = ? AND company_id = ?', [planId, req.companyId]);
    
    if (result.affectedRows === 0) throw new AppError('Business plan not found', 404);
    
    res.json({ success: true, message: 'Business plan deleted successfully' });
}));
// --- SHARE CERTIFICATE ROUTES ---
app.get('/api/company/:companyId/certificates', validateCompany, asyncHandler(async (req, res) => {
    const [rows] = await db.query('SELECT * FROM share_certificates WHERE company_id = ?', [req.companyId]);
    res.json(rows);
}));

app.post('/api/company/:companyId/certificates', validateCompany, asyncHandler(async (req, res) => {
    const [result] = await db.query('INSERT INTO share_certificates SET ?', { ...req.body, company_id: req.companyId });
    const [[newCert]] = await db.query('SELECT * FROM share_certificates WHERE id = ?', [result.insertId]);
    res.status(201).json(newCert);
}));

// --- COMPANY CHARGES (Mortgages/Loans) ---
app.get('/api/company/:companyId/charges', validateCompany, asyncHandler(async (req, res) => {
    const [rows] = await db.query('SELECT * FROM company_charges WHERE company_id = ?', [req.companyId]);
    res.json(rows);
}));

app.post('/api/company/:companyId/charges', validateCompany, asyncHandler(async (req, res) => {
    const [result] = await db.query('INSERT INTO company_charges SET ?', { ...req.body, company_id: req.companyId });
    res.status(201).json({ success: true, id: result.insertId });
}));
// --- DIVIDEND ROUTES ---

// 1. Create Declaration AND calculate distributions automatically
app.post('/api/company/:companyId/dividends/declare', validateCompany, asyncHandler(async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const { profit_amount, dividend_percentage, declaration_date, approved_by } = req.body;
        const dividendPool = profit_amount * (dividend_percentage / 100);

        // Save Declaration
        const [decResult] = await conn.query('INSERT INTO dividend_declarations SET ?', {
            company_id: req.companyId, profit_amount, dividend_percentage, declaration_date, approved_by, status: 'draft'
        });
        const declarationId = decResult.insertId;

        // Fetch current shareholders (Members with shares > 0)
        const [shareholders] = await conn.query(
            'SELECT name, shares_held FROM company_members WHERE company_id = ? AND shares_held > 0', 
            [req.companyId]
        );

        const totalShares = shareholders.reduce((sum, s) => sum + parseFloat(s.shares_held), 0);

        // Generate Distribution Records
        if (shareholders.length > 0 && totalShares > 0) {
            const distributionData = shareholders.map(s => [
                declarationId,
                s.name,
                s.shares_held,
                (s.shares_held / totalShares) * dividendPool
            ]);

            await conn.query(
                'INSERT INTO dividend_distributions (declaration_id, shareholder_name, shares_held_at_declaration, amount_allocated) VALUES ?',
                [distributionData]
            );
        }

        await conn.commit();
        res.status(201).json({ success: true, declarationId });
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}));

// 2. Get Dividend History with Distributions
app.get('/api/company/:companyId/dividends', validateCompany, asyncHandler(async (req, res) => {
    const [declarations] = await db.query(
        'SELECT * FROM dividend_declarations WHERE company_id = ? ORDER BY declaration_date DESC', 
        [req.companyId]
    );
    res.json(declarations);
}));

// 3. Get Specific Breakdown for one declaration
app.get('/api/company/:companyId/dividends/:declarationId/distributions', validateCompany, asyncHandler(async (req, res) => {
    const [rows] = await db.query(
        'SELECT * FROM dividend_distributions WHERE declaration_id = ?', 
        [req.params.declarationId]
    );
    res.json(rows);
}));
// --- DASHBOARD SUMMARY DATA ---

// GET Optimized Capital Summary
app.get('/api/company/:companyId/capital', validateCompany, asyncHandler(async (req, res) => {
    // 1. Get Authorized Structure
    const [[structure]] = await db.query(
        'SELECT authorized_shares, share_price, currency FROM company_capital_structure WHERE company_id = ?', 
        [req.companyId]
    );

    // 2. Get Issued Shares (Sum of all shares held by members)
    const [[issued]] = await db.query(
        'SELECT SUM(shares_held) as total_issued FROM company_members WHERE company_id = ?', 
        [req.companyId]
    );

    // 3. Get Paid-up Capital (Sum of confirmed contributions)
    const [[paid]] = await db.query(
        "SELECT SUM(amount) as total_paid FROM capital_entries WHERE company_id = ? AND status = 'confirmed' AND entry_type = 'contribution'", 
        [req.companyId]
    );

    res.json({
        authorized_shares: structure?.authorized_shares || 0,
        issued_shares: issued.total_issued || 0,
        paid_up_capital: paid.total_paid || 0,
        currency: structure?.currency || 'RWF'
    });
}));

// GET Clean Shareholders List
app.get('/api/company/:companyId/shareholders', validateCompany, asyncHandler(async (req, res) => {
    const [rows] = await db.query(`
        SELECT 
            id, 
            name as full_name, 
            shares_held as shares_count,
            (shares_held / (SELECT SUM(shares_held) FROM company_members WHERE company_id = ?)) * 100 as ownership_percent
        FROM company_members 
        WHERE company_id = ? AND shares_held > 0
        ORDER BY shares_held DESC
    `, [req.companyId, req.companyId]);

    res.json(rows);
}));
// --- ACCOUNTING & LEDGER ROUTES ---

// 1. GET Chart of Accounts (For the dropdown)
app.get('/api/company/:companyId/accounts', validateCompany, asyncHandler(async (req, res) => {
    await ensureDefaultAccounts(req.companyId);
    const [rows] = await db.query(
        'SELECT * FROM accounts WHERE company_id = ? AND is_active = 1 ORDER BY code ASC',
        [req.companyId]
    );
    res.json(rows);
}));

// 2. GET Accounting Books (Page-level data for AccountingBooks.tsx)
app.get('/api/company/:companyId/accounting-books', validateCompany, asyncHandler(async (req, res) => {
    await ensureDefaultAccounts(req.companyId);

    const [entries] = await db.query(`
        SELECT
            gl.id,
            je.id AS journal_entry_id,
            je.date,
            COALESCE(je.reference_no, CONCAT('JE-', LPAD(je.id, 6, '0'))) AS reference,
            a.id AS account_id,
            a.code AS account_code,
            a.name AS account_name,
            je.description,
            COALESCE(je.entry_type, 'manual') AS source_type,
            gl.debit,
            gl.credit,
            sd.file_name AS document_file_name,
            sd.file_path AS document_file_path,
            je.created_at
        FROM journal_entries je
        INNER JOIN general_ledger gl ON gl.journal_entry_id = je.id
        INNER JOIN accounts a ON a.id = gl.account_id
        LEFT JOIN supporting_documents sd ON sd.journal_entry_id = je.id
        WHERE je.company_id = ?
        ORDER BY je.date DESC, je.created_at DESC, gl.id DESC
    `, [req.companyId]);

    const [summaryRows] = await db.query(`
        SELECT
            COUNT(DISTINCT je.id) AS journalCount,
            COUNT(gl.id) AS lineCount,
            COALESCE(SUM(gl.debit), 0) AS totalDebits,
            COALESCE(SUM(gl.credit), 0) AS totalCredits
        FROM journal_entries je
        LEFT JOIN general_ledger gl ON gl.journal_entry_id = je.id
        WHERE je.company_id = ?
    `, [req.companyId]);

    const summary = summaryRows[0] || {
        journalCount: 0,
        lineCount: 0,
        totalDebits: 0,
        totalCredits: 0
    };

    res.json({
        entries,
        summary: {
            journalCount: Number(summary.journalCount || 0),
            lineCount: Number(summary.lineCount || 0),
            totalDebits: Number(summary.totalDebits || 0),
            totalCredits: Number(summary.totalCredits || 0),
            netBalance: Number(summary.totalDebits || 0) - Number(summary.totalCredits || 0)
        }
    });
}));

// 3. GET Chart of Accounts for Accounting Books UI
app.get('/api/company/:companyId/accounting-books/accounts', validateCompany, asyncHandler(async (req, res) => {
    await ensureDefaultAccounts(req.companyId);
    const [rows] = await db.query(
        'SELECT * FROM accounts WHERE company_id = ? AND is_active = 1 ORDER BY code ASC',
        [req.companyId]
    );
    res.json(rows);
}));

// 4. GET Journal Entries (History)
app.get('/api/company/:companyId/ledger/entries', validateCompany, asyncHandler(async (req, res) => {
    const [rows] = await db.query(`
        SELECT je.*, 
               (SELECT SUM(debit) FROM general_ledger WHERE journal_entry_id = je.id) as total_amount
        FROM journal_entries je 
        WHERE je.company_id = ? 
        ORDER BY je.date DESC, je.created_at DESC`, 
        [req.companyId]
    );
    res.json(rows);
}));

// 5. POST Manual Accounting Entry (Accounting Books form)
app.post('/api/company/:companyId/accounting-books/manual-entry', upload.single('receipt'), validateCompany, asyncHandler(async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        await ensureDefaultAccounts(req.companyId, conn);

        const {
            date,
            description,
            entryType,
            account_id,
            offset_account_id,
            debit,
            credit,
            reference_no
        } = req.body;

        const debitValue = Number(debit || 0);
        const creditValue = Number(credit || 0);

        if (!date || !description || !account_id || !offset_account_id) {
            throw new AppError('Date, description, main account, and balancing account are required', 400);
        }

        if (Number(account_id) === Number(offset_account_id)) {
            throw new AppError('Main account and balancing account must be different', 400);
        }

        if ((debitValue > 0 && creditValue > 0) || (debitValue <= 0 && creditValue <= 0)) {
            throw new AppError('Provide either a debit amount or a credit amount', 400);
        }

        const [[primaryAccount]] = await conn.query(
            'SELECT id FROM accounts WHERE company_id = ? AND id = ?',
            [req.companyId, account_id]
        );
        const [[offsetAccount]] = await conn.query(
            'SELECT id FROM accounts WHERE company_id = ? AND id = ?',
            [req.companyId, offset_account_id]
        );

        if (!primaryAccount || !offsetAccount) {
            throw new AppError('One or more selected accounts were not found for this company', 404);
        }

        const [jeResult] = await conn.query('INSERT INTO journal_entries SET ?', {
            company_id: req.companyId,
            date,
            description,
            entry_type: entryType || 'manual',
            reference_no: reference_no || null
        });

        const journalId = jeResult.insertId;

        await conn.query('INSERT INTO general_ledger SET ?', {
            journal_entry_id: journalId,
            account_id: Number(account_id),
            debit: debitValue,
            credit: creditValue
        });

        await conn.query('INSERT INTO general_ledger SET ?', {
            journal_entry_id: journalId,
            account_id: Number(offset_account_id),
            debit: creditValue,
            credit: debitValue
        });

        if (req.file) {
            await conn.query('INSERT INTO supporting_documents SET ?', {
                journal_entry_id: journalId,
                file_name: req.file.originalname,
                file_path: normalizePath(req.file.path),
                file_type: req.file.mimetype
            });
        }

        await conn.commit();
        res.status(201).json({
            success: true,
            journalId,
            reference: buildJournalReference(journalId, reference_no)
        });
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}));

// 6. POST Synced Quick Transaction Entries (Universal Transaction form)
app.post('/api/company/:companyId/accounting-books/transactions', validateCompany, asyncHandler(async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        await ensureDefaultAccounts(req.companyId, conn);

        const { date, description, reference, source_type, entries } = req.body;
        if (!date || !description || !Array.isArray(entries) || entries.length < 2) {
            throw new AppError('Date, description, and at least two accounting entries are required', 400);
        }

        const totalDebits = entries.reduce((sum, entry) => sum + Number(entry.debit || 0), 0);
        const totalCredits = entries.reduce((sum, entry) => sum + Number(entry.credit || 0), 0);

        if (Math.abs(totalDebits - totalCredits) > 0.01) {
            throw new AppError('Transaction does not balance: total debits must equal total credits', 400);
        }

        const [jeResult] = await conn.query('INSERT INTO journal_entries SET ?', {
            company_id: req.companyId,
            date,
            description,
            entry_type: source_type || 'manual',
            reference_no: reference || null
        });
        const journalId = jeResult.insertId;

        for (const line of entries) {
            const account = await ensureAccountByCode(req.companyId, line, conn);
            await conn.query('INSERT INTO general_ledger SET ?', {
                journal_entry_id: journalId,
                account_id: account.id,
                debit: Number(line.debit || 0),
                credit: Number(line.credit || 0)
            });
        }

        await conn.commit();
        res.status(201).json({
            success: true,
            journalId,
            reference: buildJournalReference(journalId, reference)
        });
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}));

// 7. POST New Accounting Entry (Legacy double-entry route kept for compatibility)
app.post('/api/company/:companyId/ledger/entry', upload.single('receipt'), validateCompany, asyncHandler(async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        await ensureDefaultAccounts(req.companyId, conn);

        const { 
            date, 
            description, 
            entryType, 
            account_id, 
            debit, 
            credit,
            offset_account_id
        } = req.body;

        const [jeResult] = await conn.query('INSERT INTO journal_entries SET ?', {
            company_id: req.companyId,
            date,
            description,
            entry_type: entryType,
            reference_no: req.body.reference_no || null
        });
        const journalId = jeResult.insertId;

        await conn.query('INSERT INTO general_ledger SET ?', {
            journal_entry_id: journalId,
            account_id: account_id,
            debit: debit || 0,
            credit: credit || 0
        });

        await conn.query('INSERT INTO general_ledger SET ?', {
            journal_entry_id: journalId,
            account_id: offset_account_id,
            debit: credit || 0,
            credit: debit || 0
        });

        if (req.file) {
            await conn.query('INSERT INTO supporting_documents SET ?', {
                journal_entry_id: journalId,
                file_name: req.file.originalname,
                file_path: normalizePath(req.file.path),
                file_type: req.file.mimetype
            });
        }

        await conn.commit();
        res.status(201).json({ success: true, journalId });

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}));

// 8. GET Financial Trial Balance
app.get('/api/company/:companyId/ledger/trial-balance', validateCompany, asyncHandler(async (req, res) => {
    const [rows] = await db.query(`
        SELECT a.name, a.code, a.category,
               SUM(gl.debit) as total_debit,
               SUM(gl.credit) as total_credit,
               (SUM(gl.debit) - SUM(gl.credit)) as net_balance
        FROM accounts a
        LEFT JOIN general_ledger gl ON a.id = gl.account_id
        WHERE a.company_id = ?
        GROUP BY a.id`, 
        [req.companyId]
    );
    res.json(rows);
}));

// 9. GET Invoices & Receipts Register
app.get('/api/company/:companyId/invoices-receipts', validateCompany, asyncHandler(async (req, res) => {
    const [rows] = await db.query(
        'SELECT * FROM invoice WHERE company_id = ? ORDER BY date DESC, created_at DESC',
        [req.companyId]
    );

    const records = rows.map((row) => ({
        ...row,
        amount: Number(row.amount || 0),
        vat: Number(row.vat || 0),
        total: Number(row.total || 0)
    }));

    const invoices = records.filter((record) => record.type === 'invoice');
    const receipts = records.filter((record) => record.type === 'receipt');

    res.json({
        records,
        summary: {
            totalInvoices: invoices.length,
            totalReceipts: receipts.length,
            totalSales: invoices.reduce((sum, item) => sum + item.total, 0),
            totalPurchases: receipts.reduce((sum, item) => sum + item.total, 0),
            outstandingInvoices: invoices.filter((item) => item.status !== 'paid').length,
            pendingReceipts: receipts.filter((item) => item.status === 'draft').length
        }
    });
}));

// 10. POST Manual Invoice/Receipt Record
app.post('/api/company/:companyId/invoices-receipts', validateCompany, asyncHandler(async (req, res) => {
    const {
        transaction_id,
        type,
        number,
        party_name,
        tin,
        description,
        amount,
        vat,
        total,
        attachment_url,
        date,
        due_date,
        status,
        payment_method,
        phone_number,
        momo_reference,
        tax_category
    } = req.body;

    if (!type || !party_name || !date) {
        throw new AppError('Type, party name, and date are required', 400);
    }

    const record = {
        company_id: req.companyId,
        transaction_id: transaction_id || null,
        type,
        number: number || generateInvoiceNumber(type),
        party_name,
        tin: tin || null,
        description: description || null,
        amount: Number(amount || 0),
        vat: Number(vat || 0),
        total: Number(total || amount || 0),
        attachment_url: attachment_url || null,
        date,
        due_date: due_date || null,
        status: status || 'draft',
        payment_method: payment_method || null,
        phone_number: phone_number || null,
        momo_reference: momo_reference || null,
        tax_category: tax_category || null
    };

    const [result] = await db.query('INSERT INTO invoice SET ?', record);
    const [[saved]] = await db.query('SELECT * FROM invoice WHERE id = ?', [result.insertId]);
    res.status(201).json(saved);
}));

// 11. Sync Universal Transaction sales/purchases into Invoice register
app.post('/api/company/:companyId/invoices-receipts/sync-transaction', validateCompany, asyncHandler(async (req, res) => {
    const {
        transaction_id,
        type,
        number,
        party_name,
        tin,
        description,
        amount,
        vat,
        total,
        attachment_url,
        date,
        due_date,
        status,
        payment_method,
        phone_number,
        momo_reference,
        tax_category
    } = req.body;

    if (!transaction_id || !type || !party_name || !date) {
        throw new AppError('transaction_id, type, party_name, and date are required', 400);
    }

    const invoiceType = type === 'purchase' || type === 'receipt' ? 'receipt' : 'invoice';
    const recordNumber = number || generateInvoiceNumber(invoiceType);
    const recordStatus = status || 'draft';
    const recordTotal = Number(total || amount || 0);
    const recordVat = Number(vat || 0);
    const recordAmount = Number(amount || recordTotal - recordVat || 0);

    const [existing] = await db.query(
        'SELECT id FROM invoice WHERE company_id = ? AND transaction_id = ? AND type = ? LIMIT 1',
        [req.companyId, transaction_id, invoiceType]
    );

    const record = {
        company_id: req.companyId,
        transaction_id,
        type: invoiceType,
        number: recordNumber,
        party_name,
        tin: tin || null,
        description: description || null,
        amount: recordAmount,
        vat: recordVat,
        total: recordTotal,
        attachment_url: attachment_url || null,
        date,
        due_date: due_date || null,
        status: recordStatus,
        payment_method: payment_method || null,
        phone_number: phone_number || null,
        momo_reference: momo_reference || null,
        tax_category: tax_category || null
    };

    let savedId;
    if (existing.length) {
        savedId = existing[0].id;
        await db.query('UPDATE invoice SET ? WHERE id = ? AND company_id = ?', [record, savedId, req.companyId]);
    } else {
        const [result] = await db.query('INSERT INTO invoice SET ?', record);
        savedId = result.insertId;
    }

    const [[saved]] = await db.query('SELECT * FROM invoice WHERE id = ?', [savedId]);
    res.status(existing.length ? 200 : 201).json(saved);
}));

// 12. GET Contracts & Agreements Register
app.get('/api/company/:companyId/contracts', validateCompany, asyncHandler(async (req, res) => {
    const [rows] = await db.query(
        'SELECT * FROM contract WHERE company_id = ? ORDER BY end_date ASC, created_at DESC',
        [req.companyId]
    );

    const records = rows.map((row) => ({
        ...row,
        value: Number(row.value || 0)
    }));

    const summary = {
        totalContracts: records.length,
        activeContracts: records.filter((record) => record.status === 'Active').length,
        expiringSoon: records.filter((record) => {
            if (record.status !== 'Active') return false;
            const endDate = new Date(record.end_date);
            const today = new Date();
            const diffDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays <= 30;
        }).length,
        totalValue: records.reduce((sum, record) => sum + record.value, 0)
    };

    res.json({ records, summary });
}));

// 13. POST Contract / Agreement
app.post('/api/company/:companyId/contracts', upload.single('file'), validateCompany, asyncHandler(async (req, res) => {
    const {
        title,
        type,
        parties,
        start_date,
        end_date,
        status,
        value,
        notes
    } = req.body;

    if (!title || !type || !parties || !start_date || !end_date) {
        throw new AppError('Title, type, parties, start date, and end date are required', 400);
    }

    const contractData = {
        company_id: req.companyId,
        title: title.trim(),
        type: type.trim(),
        parties: parties.trim(),
        start_date,
        end_date,
        status: status || 'Active',
        value: Number(value || 0),
        file_name: req.file?.originalname || null,
        file_path: normalizePath(req.file?.path),
        notes: notes || null
    };

    const [result] = await db.query('INSERT INTO contract SET ?', contractData);
    const [[saved]] = await db.query('SELECT * FROM contract WHERE id = ?', [result.insertId]);
    saved.value = Number(saved.value || 0);
    res.status(201).json(saved);
}));
// ==========================================
// --- ROLES ROUTES ---
// ==========================================

app.get('/api/roles', asyncHandler(async (req, res) => {
    const [rows] = await db.query('SELECT * FROM roles ORDER BY name ASC');
    res.json(rows);
}));

app.post('/api/roles', asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name) throw new AppError('Role name is required', 400);
    const [result] = await db.query('INSERT INTO roles SET ?', [{ name: name.trim() }]);
    const [[role]] = await db.query('SELECT * FROM roles WHERE id = ?', [result.insertId]);
    res.status(201).json(role);
}));

app.put('/api/roles/:id', asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name) throw new AppError('Role name is required', 400);
    const [result] = await db.query('UPDATE roles SET name = ? WHERE id = ?', [name.trim(), req.params.id]);
    if (result.affectedRows === 0) throw new AppError('Role not found', 404);
    const [[role]] = await db.query('SELECT * FROM roles WHERE id = ?', [req.params.id]);
    res.json(role);
}));

app.delete('/api/roles/:id', asyncHandler(async (req, res) => {
    const [[{ count }]] = await db.query('SELECT COUNT(*) as count FROM users WHERE role_id = ?', [req.params.id]);
    if (count > 0) throw new AppError(`Cannot delete: ${count} user(s) assigned to this role`, 409);
    const [result] = await db.query('DELETE FROM roles WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) throw new AppError('Role not found', 404);
    res.json({ success: true, message: 'Role deleted successfully' });
}));

// ==========================================
// --- DEPARTMENTS ROUTES ---
// ==========================================

app.get('/api/departments', asyncHandler(async (req, res) => {
    const [rows] = await db.query('SELECT * FROM departments ORDER BY name ASC');
    res.json(rows);
}));

app.post('/api/departments', asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name) throw new AppError('Department name is required', 400);
    const [result] = await db.query('INSERT INTO departments SET ?', [{ name: name.trim() }]);
    const [[dept]] = await db.query('SELECT * FROM departments WHERE id = ?', [result.insertId]);
    res.status(201).json(dept);
}));

app.put('/api/departments/:id', asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name) throw new AppError('Department name is required', 400);
    const [result] = await db.query('UPDATE departments SET name = ? WHERE id = ?', [name.trim(), req.params.id]);
    if (result.affectedRows === 0) throw new AppError('Department not found', 404);
    const [[dept]] = await db.query('SELECT * FROM departments WHERE id = ?', [req.params.id]);
    res.json(dept);
}));

app.delete('/api/departments/:id', asyncHandler(async (req, res) => {
    const [[{ count }]] = await db.query('SELECT COUNT(*) as count FROM users WHERE department_id = ?', [req.params.id]);
    if (count > 0) throw new AppError(`Cannot delete: ${count} user(s) assigned to this department`, 409);
    const [result] = await db.query('DELETE FROM departments WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) throw new AppError('Department not found', 404);
    res.json({ success: true, message: 'Department deleted successfully' });
}));

// ==========================================
// --- PERMISSIONS ROUTES ---
// ==========================================

app.get('/api/permissions', asyncHandler(async (req, res) => {
    const [rows] = await db.query('SELECT * FROM permissions ORDER BY name ASC');
    res.json(rows);
}));

app.post('/api/permissions', asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name) throw new AppError('Permission name is required', 400);
    const [result] = await db.query('INSERT INTO permissions SET ?', [{ name: name.trim() }]);
    const [[perm]] = await db.query('SELECT * FROM permissions WHERE id = ?', [result.insertId]);
    res.status(201).json(perm);
}));

app.delete('/api/permissions/:id', asyncHandler(async (req, res) => {
    await db.query('DELETE FROM user_permissions WHERE permission_id = ?', [req.params.id]);
    const [result] = await db.query('DELETE FROM permissions WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) throw new AppError('Permission not found', 404);
    res.json({ success: true, message: 'Permission deleted successfully' });
}));

// ==========================================
// --- USERS ROUTES ---
// ==========================================

app.get('/api/users', asyncHandler(async (req, res) => {
    const [rows] = await db.query(`
        SELECT 
            u.id, u.name, u.email, u.status, u.last_login, u.created_at,
            r.id as role_id, r.name as role,
            d.id as department_id, d.name as department,
            GROUP_CONCAT(p.name ORDER BY p.name SEPARATOR ',') as permissions
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN departments d ON u.department_id = d.id
        LEFT JOIN user_permissions up ON u.id = up.user_id
        LEFT JOIN permissions p ON up.permission_id = p.id
        GROUP BY u.id
        ORDER BY u.created_at DESC
    `);

    const users = rows.map(u => ({
        ...u,
        permissions: u.permissions ? u.permissions.split(',') : []
    }));

    res.json(users);
}));

app.get('/api/users/:id', asyncHandler(async (req, res) => {
    const [[user]] = await db.query(`
        SELECT 
            u.id, u.name, u.email, u.status, u.last_login, u.created_at,
            r.id as role_id, r.name as role,
            d.id as department_id, d.name as department
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE u.id = ?
    `, [req.params.id]);

    if (!user) throw new AppError('User not found', 404);

    const [perms] = await db.query(`
        SELECT p.name FROM permissions p
        JOIN user_permissions up ON p.id = up.permission_id
        WHERE up.user_id = ?
    `, [user.id]);

    res.json({ ...user, permissions: perms.map(p => p.name) });
}));

app.post('/api/users', asyncHandler(async (req, res) => {
    const { name, email, password, role_id, department_id, status, permissions = [] } = req.body;

    if (!name || !email || !password) throw new AppError('Name, email and password are required', 400);

    const password_hash = await bcrypt.hash(password, 10);

    const [result] = await db.query('INSERT INTO users SET ?', [{
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password_hash,
        role_id: role_id || null,
        department_id: department_id || null,
        status: status || 'Active'
    }]);

    const userId = result.insertId;

    if (permissions.length > 0) {
        const permRows = permissions.map(pid => [userId, pid]);
        await db.query('INSERT INTO user_permissions (user_id, permission_id) VALUES ?', [permRows]);
    }

    const [[newUser]] = await db.query('SELECT id, name, email, status, created_at FROM users WHERE id = ?', [userId]);
    res.status(201).json(newUser);
}));

app.put('/api/users/:id', asyncHandler(async (req, res) => {
    const { name, email, password, role_id, department_id, status, permissions } = req.body;

    const [[existing]] = await db.query('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (!existing) throw new AppError('User not found', 404);

    const updateData = {
        ...(name && { name: name.trim() }),
        ...(email && { email: email.trim().toLowerCase() }),
        ...(role_id !== undefined && { role_id }),
        ...(department_id !== undefined && { department_id }),
        ...(status && { status })
    };

    if (password) updateData.password_hash = await bcrypt.hash(password, 10);

    await db.query('UPDATE users SET ?, updated_at = NOW() WHERE id = ?', [updateData, req.params.id]);

    if (Array.isArray(permissions)) {
        await db.query('DELETE FROM user_permissions WHERE user_id = ?', [req.params.id]);
        if (permissions.length > 0) {
            const permRows = permissions.map(pid => [req.params.id, pid]);
            await db.query('INSERT INTO user_permissions (user_id, permission_id) VALUES ?', [permRows]);
        }
    }

    const [[updatedUser]] = await db.query('SELECT id, name, email, status, updated_at FROM users WHERE id = ?', [req.params.id]);
    res.json(updatedUser);
}));

app.patch('/api/users/:id/status', asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!['Active', 'Inactive', 'Suspended'].includes(status)) throw new AppError('Invalid status value', 400);
    const [result] = await db.query('UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?', [status, req.params.id]);
    if (result.affectedRows === 0) throw new AppError('User not found', 404);
    res.json({ success: true, message: `User status updated to ${status}` });
}));

app.delete('/api/users/:id', asyncHandler(async (req, res) => {
    const [[user]] = await db.query('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (!user) throw new AppError('User not found', 404);
    await db.query('DELETE FROM user_permissions WHERE user_id = ?', [req.params.id]);
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'User deleted successfully' });
}));
app.use((req, res) => { res.status(404).json({ success: false, error: `Route ${req.originalUrl} not found` }); });

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
