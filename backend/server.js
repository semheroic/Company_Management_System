// ── TOP OF FILE ── replace the entire chained require block with this:

 if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
const express = require('express'),
    mysql = require('mysql2'),
    bcrypt = require('bcrypt'),
    cors = require('cors'),
    cookieParser = require('cookie-parser'),
    // dotenv is already required above, remove it from here
    session = require('express-session'),
    multer = require('multer'),
    fs = require('fs'),
    fsPromises = fs.promises,
    path = require('path'),
    { runMigrations } = require('./lib/runMigrations'),
    { signJwt, verifyJwt } = require('./lib/jwt');
const MySQLStore = require('express-mysql-session')(session);
const app = express(), PORT = process.env.PORT || 5000;
app.set('trust proxy', 1); 
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'office_manager.sid';
const SESSION_SECRET = process.env.SESSION_SECRET || JWT_SECRET;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const SESSION_OPERATION_TIMEOUT_MS = 5000;
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:8081')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, origin || allowedOrigins[0]);
            return;
        }
        console.log('Blocked CORS origin:', origin);
        callback(null, false);  // ✅ silently reject, don't crash
    },
    credentials: true
}));
app.use(cookieParser());
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


const isProduction = process.env.NODE_ENV === 'production';
console.log("ENV:", process.env.NODE_ENV);
console.log("DB MODE:", isProduction ? "Production" : "Local");

// ================= DATABASE =================

const dbConfig = {
    host: isProduction
        ? process.env.MYSQLHOST || process.env.DB_HOST
        : process.env.DB_HOST || "localhost",

    port: isProduction
        ? Number(process.env.MYSQLPORT || process.env.DB_PORT)
        : Number(process.env.DB_PORT) || 3306,

    user: isProduction
        ? process.env.MYSQLUSER || process.env.DB_USER
        : process.env.DB_USER || "root",

    password: isProduction
        ? process.env.MYSQLPASSWORD || process.env.DB_PASSWORD
        : process.env.DB_PASSWORD || "",

    database: isProduction
        ? process.env.MYSQLDATABASE || process.env.DB_NAME
        : process.env.DB_NAME || "office_manager_db",

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 60000
};

// ================= MYSQL POOL =================

const db = mysql.createPool(dbConfig).promise();

// ================= SESSION STORE =================

const sessionStore = new MySQLStore({
    ...dbConfig,

    clearExpired: true,
    checkExpirationInterval: 15 * 60 * 1000,
    expiration: SESSION_TTL_MS,
    createDatabaseTable: true
});

// ================= DB CONNECTION TEST =================


const sessionCookieConfig = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',  // ✅ cross-origin fix
    maxAge: SESSION_TTL_MS
};

const sessionMiddleware = session({
    name: SESSION_COOKIE_NAME,
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    store: sessionStore,
    cookie: sessionCookieConfig
});

app.use((req, res, next) => {
    sessionMiddleware(req, res, (error) => {
        if (!error) {
            next();
            return;
        }

        const hasSessionCookie = Boolean(req.cookies?.[SESSION_COOKIE_NAME]);
        const isRecoverableSessionError =
            hasSessionCookie &&
            (error instanceof SyntaxError ||
                /session/i.test(error.message || '') ||
                /json/i.test(error.message || ''));

        if (isRecoverableSessionError) {
            res.clearCookie(SESSION_COOKIE_NAME, {
                httpOnly: sessionCookieConfig.httpOnly,
                secure: sessionCookieConfig.secure,
                sameSite: sessionCookieConfig.sameSite
            });
            req.session = null;
            next();
            return;
        }

        next(error);
    });
});

const verifyDatabaseConnection = async () => {
    const conn = await db.getConnection();
    console.log('DB connected');
    conn.release();
};

db.getConnection()
    .then(conn => { console.log('âœ… DB Connected'); conn.release(); })
    .catch(err => { console.error('âŒ DB Connection Error:', err.message); process.exit(1); });

// --- 3. FILE UPLOADS & UTILS ---

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const safeDelete = async (filePath) => { if (filePath) try { await fsPromises.unlink(filePath); } catch { } };
const normalizePath = (p) => p ? p.replace(/\\/g, '/') : null;
const isManagedUploadPath = (value) => {
    const normalized = normalizePath(value);
    return Boolean(normalized && normalized.startsWith('uploads/'));
};
const cleanupManagedUpload = async (value) => {
    if (isManagedUploadPath(value)) {
        await safeDelete(value);
    }
};
const DEFAULT_PROFILE_PICTURE_URL = '/default-avatar.svg';
const COMPANY_SELECT_FIELDS = `
    id,
    name,
    logo_url,
    registration_number,
    tin,
    email,
    phone,
    address,
    sector,
    size,
    currency,
    incorporation_date,
    fiscal_year_start,
    tax_regime,
    country,
    status,
    created_at,
    updated_at
`;
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

const parseJsonSafely = (value) => {
    if (!value) return null;
    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
};

const toNumber = (value) => Number(value || 0);

const getTodayDate = () => new Date().toISOString().split('T')[0];

const resolveTaxReturnStatus = (status, dueDate, submissionDate) => {
    if (submissionDate || status === 'Filed') {
        return 'Filed';
    }

    if (dueDate && new Date(dueDate) < new Date(getTodayDate())) {
        return 'Overdue';
    }

    return status || 'Pending';
};

const formatFixedAssetRecord = (row) => ({
    ...row,
    acquisition_cost: toNumber(row.acquisition_cost),
    useful_life_years: toNumber(row.useful_life_years),
    residual_value: toNumber(row.residual_value),
    disposal_amount: row.disposal_amount === null || row.disposal_amount === undefined ? null : toNumber(row.disposal_amount)
});

const formatTaxReturnRecord = (row) => ({
    ...row,
    total_declared: toNumber(row.total_declared),
    payload: parseJsonSafely(row.payload_json)
});

const parseRolesValue = (value) => {
    if (Array.isArray(value)) return value;
    const parsed = parseJsonSafely(value);
    return Array.isArray(parsed) ? parsed : [];
};

const resolveDeadlineStatus = (status, dueDate) => {
    if (status === 'completed') return 'completed';
    if (dueDate && new Date(dueDate) < new Date(getTodayDate())) return 'overdue';
    return status || 'pending';
};

const calculatePaye = (grossSalary) => {
    const taxableAmount = Math.max(0, toNumber(grossSalary) - 30000);
    return Math.round(taxableAmount * 0.15);
};

const calculateRssb = (grossSalary) => {
    const normalized = toNumber(grossSalary);
    return {
        employee: Math.round(normalized * 0.075),
        employer: Math.round(normalized * 0.075)
    };
};

const formatEmployeeRecord = (row) => ({
    ...row,
    gross_salary: toNumber(row.gross_salary)
});

const formatPayrollRecord = (row) => ({
    id: Number(row.id),
    company_id: Number(row.company_id),
    employee_id: Number(row.employee_id),
    payroll_month: row.payroll_month,
    pay_date: row.pay_date,
    gross_salary: toNumber(row.gross_salary),
    paye_tax: toNumber(row.paye_tax),
    rssb_employee: toNumber(row.rssb_employee),
    rssb_employer: toNumber(row.rssb_employer),
    net_salary: toNumber(row.net_salary),
    status: row.status,
    paid_at: row.paid_at,
    accounting_journal_id: row.accounting_journal_id === null || row.accounting_journal_id === undefined
        ? null
        : Number(row.accounting_journal_id),
    accounting_posted_at: row.accounting_posted_at || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    employee: row.employee_id ? {
        id: Number(row.employee_id),
        full_name: row.employee_full_name,
        email: row.employee_email,
        phone: row.employee_phone,
        national_id: row.employee_national_id,
        position: row.employee_position,
        department: row.employee_department,
        start_date: row.employee_start_date,
        gross_salary: toNumber(row.employee_gross_salary),
        rssb_number: row.employee_rssb_number,
        status: row.employee_status,
        contract_file_name: row.employee_contract_file_name,
        contract_file_path: row.employee_contract_file_path
    } : null
});

const PAYROLL_RECORD_SELECT = `
    SELECT
        pr.*,
        e.full_name AS employee_full_name,
        e.email AS employee_email,
        e.phone AS employee_phone,
        e.national_id AS employee_national_id,
        e.position AS employee_position,
        e.department AS employee_department,
        e.start_date AS employee_start_date,
        e.gross_salary AS employee_gross_salary,
        e.rssb_number AS employee_rssb_number,
        e.status AS employee_status,
        e.contract_file_name AS employee_contract_file_name,
        e.contract_file_path AS employee_contract_file_path
    FROM payroll_records pr
    JOIN employees e ON e.id = pr.employee_id
    WHERE pr.company_id = ?
`;

const buildPayrollSummary = (records, month) => ({
    ...(month ? { month } : {}),
    totalEmployees: records.length,
    totalGrossPay: records.reduce((sum, record) => sum + record.gross_salary, 0),
    totalPaye: records.reduce((sum, record) => sum + record.paye_tax, 0),
    totalRssbEmployee: records.reduce((sum, record) => sum + record.rssb_employee, 0),
    totalRssbEmployer: records.reduce((sum, record) => sum + record.rssb_employer, 0),
    totalNetPay: records.reduce((sum, record) => sum + record.net_salary, 0),
    paidCount: records.filter((record) => record.status === 'paid').length,
    unpaidCount: records.filter((record) => record.status === 'unpaid').length
});

const formatAuditReportRecord = (row) => ({
    ...row,
    findings_count: Number(row.findings_count || 0)
});

const formatComplaintRiskRecord = (row) => ({
    ...row
});

const formatComplianceAlertRecord = (row) => ({
    ...row,
    for_roles: parseRolesValue(row.for_roles_json),
    is_read: Boolean(row.is_read)
});

const formatComplianceDeadlineRecord = (row) => ({
    ...row,
    status: resolveDeadlineStatus(row.status, row.due_date)
});

const formatDocumentVaultRecord = (row) => ({
    ...row,
    file_size: Number(row.file_size || 0),
    secured: Boolean(row.secured)
});

const formatNotificationRecord = (row) => ({
    ...row,
    company_id: Number(row.company_id),
    is_read: Boolean(row.is_read)
});

const defaultCompanySettings = () => ({
    general: {
        companyName: '',
        companyEmail: '',
        timeZone: 'Africa/Kigali',
        currency: 'RWF',
        language: 'English'
    },
    notifications: {
        emailNotifications: true,
        smsNotifications: false,
        deadlineAlerts: true,
        systemUpdates: true,
        reportReady: true
    },
    security: {
        twoFactorAuth: false,
        sessionTimeout: '30',
        passwordPolicy: 'strong',
        auditLogging: true
    },
    integrations: {
        emailServiceConfigured: false,
        backupConfigured: false
    }
});

const buildSettingsResponse = (row) => {
    const defaults = defaultCompanySettings();
    if (!row) return defaults;

    return {
        general: parseJsonSafely(row.general_json) || defaults.general,
        notifications: parseJsonSafely(row.notifications_json) || defaults.notifications,
        security: parseJsonSafely(row.security_json) || defaults.security,
        integrations: parseJsonSafely(row.integrations_json) || defaults.integrations
    };
};

const getAuthTokenFromRequest = (req) => {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
        throw new AppError('Authorization token is required', 401);
    }

    return header.slice(7).trim();
};

const getSessionUserId = (req) => {
    const userId = req.session?.authUserId;
    return userId ? Number(userId) : null;
};

const normalizeOptionalString = (value) => {
    if (value === undefined) return undefined;
    if (value === null) return null;

    const normalized = String(value).trim();
    return normalized ? normalized : null;
};

const normalizeRequiredString = (value, fieldName) => {
    const normalized = normalizeOptionalString(value);
    if (!normalized) {
        throw new AppError(`${fieldName} is required`, 400);
    }
    return normalized;
};

const normalizeOptionalEmail = (value) => {
    const normalized = normalizeOptionalString(value);
    return normalized ? normalized.toLowerCase() : normalized;
};

const normalizeDateOnly = (value, fieldName) => {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;

    const normalized = String(value).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
        throw new AppError(`${fieldName} must use YYYY-MM-DD format`, 400);
    }

    return normalized;
};

const normalizeFiscalYearStart = (value) => {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;

    const normalized = String(value).trim();
    if (!/^\d{2}-\d{2}$/.test(normalized)) {
        throw new AppError('Fiscal year start must use MM-DD format', 400);
    }

    return normalized;
};

const normalizeCompanyStatus = (value, defaultValue) => {
    if (value === undefined) return defaultValue;

    const normalized = String(value).trim().toLowerCase();
    if (!normalized) return defaultValue;

    if (!['active', 'inactive', 'pending', 'suspended'].includes(normalized)) {
        throw new AppError('Invalid company status', 400);
    }

    return normalized;
};

const normalizeProfilePictureUrl = (value) => {
    const normalized = normalizeOptionalString(value);
    return normalized ? normalizePath(normalized) : null;
};

const applyDefaultProfilePicture = (user) => ({
    ...user,
    profile_picture_url: user?.profile_picture_url || DEFAULT_PROFILE_PICTURE_URL
});

const mapCompanyRow = (row) => ({
    ...row,
    logo_url: row.logo_url || null,
    registration_number: row.registration_number || null,
    sector: row.sector || null,
    size: row.size || null,
    currency: row.currency || 'RWF',
    incorporation_date: row.incorporation_date || null,
    fiscal_year_start: row.fiscal_year_start || '01-01',
    tax_regime: row.tax_regime || 'General',
    country: row.country || 'Rwanda',
    status: row.status || 'active'
});

const getCompanyById = async (companyId, conn = db) => {
    const [[company]] = await conn.query(`
        SELECT ${COMPANY_SELECT_FIELDS}
        FROM companies
        WHERE id = ?
        LIMIT 1
    `, [companyId]);

    if (!company) {
        throw new AppError('Company not found', 404);
    }

    return mapCompanyRow(company);
};

const buildCompanyPayload = (body, { isCreate = false, allowEmpty = false } = {}) => {
    const payload = {};

    if (isCreate || body.name !== undefined) {
        payload.name = normalizeRequiredString(body.name, 'Company name');
    }

    const fieldMap = {
        logo_url: normalizeProfilePictureUrl(body.logo_url),
        registration_number: normalizeOptionalString(body.registration_number ?? body.registration_no),
        tin: normalizeOptionalString(body.tin),
        email: normalizeOptionalEmail(body.email),
        phone: normalizeOptionalString(body.phone),
        address: normalizeOptionalString(body.address),
        sector: normalizeOptionalString(body.sector ?? body.industry),
        size: normalizeOptionalString(body.size),
        currency: normalizeOptionalString(body.currency)?.toUpperCase() ?? undefined,
        incorporation_date: normalizeDateOnly(body.incorporation_date, 'Incorporation date'),
        fiscal_year_start: normalizeFiscalYearStart(body.fiscal_year_start),
        tax_regime: normalizeOptionalString(body.tax_regime),
        country: normalizeOptionalString(body.country),
        status: normalizeCompanyStatus(body.status, isCreate ? 'active' : undefined)
    };

    Object.entries(fieldMap).forEach(([key, value]) => {
        if (value !== undefined) {
            payload[key] = value;
        }
    });

    if (isCreate) {
        payload.currency = payload.currency || 'RWF';
        payload.fiscal_year_start = payload.fiscal_year_start || '01-01';
        payload.tax_regime = payload.tax_regime || 'General';
        payload.country = payload.country || 'Rwanda';
        payload.status = payload.status || 'active';
    } else if (!allowEmpty && !Object.keys(payload).length) {
        throw new AppError('At least one company field is required', 400);
    }

    return payload;
};

const createNotification = async (companyId, notification, conn = db) => {
    const notificationId =
        typeof globalThis.crypto?.randomUUID === 'function'
            ? globalThis.crypto.randomUUID()
            : `notif-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const payload = {
        id: notificationId,
        company_id: companyId,
        title: normalizeRequiredString(notification.title, 'Notification title'),
        message: normalizeRequiredString(notification.message, 'Notification message'),
        type: notification.type || 'info',
        priority: notification.priority || 'medium',
        is_read: notification.is_read ? 1 : 0,
        due_date: notification.due_date || null,
        action_url: normalizeOptionalString(notification.action_url)
    };

    await conn.query('INSERT INTO notifications SET ?', payload);
    const [[saved]] = await conn.query('SELECT * FROM notifications WHERE id = ? LIMIT 1', [notificationId]);
    return saved ? formatNotificationRecord(saved) : null;
};

const getAuthenticatedUserId = (req) => {
    const authorizationHeader = req.headers.authorization || '';
    if (authorizationHeader.startsWith('Bearer ')) {
        try {
            const payload = verifyJwt(getAuthTokenFromRequest(req), JWT_SECRET);
            return Number(payload.sub);
        } catch (error) {
            throw new AppError('Invalid or expired authorization token', 401);
        }
    }

    const sessionUserId = getSessionUserId(req);
    if (sessionUserId) {
        return sessionUserId;
    }

    throw new AppError('Authentication is required', 401);
};

const getAuthUserById = async (userId) => {
    const [[user]] = await db.query(`
        SELECT
            u.id, u.name, u.email, u.profile_picture_url, u.status, u.last_login, u.created_at,
            r.id AS role_id, r.name AS role,
            d.id AS department_id, d.name AS department
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE u.id = ?
        LIMIT 1
    `, [userId]);

    if (!user) {
        throw new AppError('User not found', 404);
    }

    const [permissionRows] = await db.query(`
        SELECT p.name
        FROM permissions p
        JOIN user_permissions up ON p.id = up.permission_id
        WHERE up.user_id = ?
        ORDER BY p.name ASC
    `, [userId]);

    return {
        ...applyDefaultProfilePicture(user),
        permissions: permissionRows.map((permission) => permission.name)
    };
};

const createAuthResponse = async (userId) => {
    const user = await getAuthUserById(userId);
    const token = signJwt(
        {
            sub: user.id,
            email: user.email,
            role: user.role || null
        },
        JWT_SECRET,
        JWT_EXPIRES_IN
    );

    return { token, user };
};

const withTimeout = (promise, timeoutMs, label) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs);

    Promise.resolve(promise)
        .then((value) => {
            clearTimeout(timer);
            resolve(value);
        })
        .catch((error) => {
            clearTimeout(timer);
            reject(error);
        });
});

const persistAuthenticatedSession = (req, userId) => new Promise((resolve, reject) => {
    req.session.regenerate((regenerateError) => {
        if (regenerateError) {
            reject(regenerateError);
            return;
        }

        req.session.authUserId = Number(userId);
        req.session.save((saveError) => {
            if (saveError) {
                reject(saveError);
                return;
            }

            resolve();
        });
    });
});

const persistAuthenticatedSessionSafely = async (req, userId) => {
    try {
        await withTimeout(
            persistAuthenticatedSession(req, userId),
            SESSION_OPERATION_TIMEOUT_MS,
            'Session persistence'
        );
    } catch (error) {
        console.error(`[Auth] Session persistence skipped: ${error.message}`);
    }
};

const destroyAuthenticatedSession = (req) => new Promise((resolve, reject) => {
    if (!req.session) {
        resolve();
        return;
    }

    req.session.destroy((error) => {
        if (error) {
            reject(error);
            return;
        }

        resolve();
    });
});

// --- 4. MIDDLEWARE ---

// --- 4. MIDDLEWARE ---

const requireAuth = asyncHandler(async (req, res, next) => {
    const userId = getAuthenticatedUserId(req);
    const [[user]] = await db.query('SELECT id, status FROM users WHERE id = ? LIMIT 1', [userId]);

    if (!user) {
        throw new AppError('User not found', 404);
    }

    if (user.status !== 'Active') {
        if (req.session) {
            req.session.authUserId = null;
        }

        throw new AppError(`This account is ${String(user.status).toLowerCase()}`, 403);
    }

    req.authUserId = Number(user.id);
    next();
});

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

app.post('/api/auth/signup', upload.single('profile_picture'), asyncHandler(async (req, res) => {
    const {
        name,
        email,
        password,
        role_id,
        department_id,
        profile_picture_url
    } = req.body;

    if (!name || !email || !password) {
        await cleanupManagedUpload(req.file?.path);
        throw new AppError('Name, email, and password are required', 400);
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const [[existingUser]] = await db.query('SELECT id FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
    if (existingUser) {
        await cleanupManagedUpload(req.file?.path);
        throw new AppError('An account with that email already exists', 409);
    }

    const [[{ totalUsers }]] = await db.query('SELECT COUNT(*) AS totalUsers FROM users');
    let resolvedRoleId = role_id || null;

    if (!resolvedRoleId) {
        const [[adminRole]] = await db.query(`SELECT id FROM roles WHERE name = 'Administrator' LIMIT 1`);
        resolvedRoleId = totalUsers === 0 ? adminRole?.id || null : null;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await db.query('INSERT INTO users SET ?', [{
        name: String(name).trim(),
        email: normalizedEmail,
        profile_picture_url: req.file
            ? normalizePath(req.file.path)
            : normalizeProfilePictureUrl(profile_picture_url),
        password_hash: passwordHash,
        role_id: resolvedRoleId,
        department_id: department_id || null,
        status: 'Active'
    }]);

    if (resolvedRoleId) {
        const [[role]] = await db.query('SELECT name FROM roles WHERE id = ? LIMIT 1', [resolvedRoleId]);
        if (role?.name === 'Administrator') {
            const [permissionRows] = await db.query('SELECT id FROM permissions');
            if (permissionRows.length) {
                const values = permissionRows.map((permission) => [result.insertId, permission.id]);
                await db.query('INSERT IGNORE INTO user_permissions (user_id, permission_id) VALUES ?', [values]);
            }
        }
    }

    await persistAuthenticatedSessionSafely(req, result.insertId);
    const authPayload = await createAuthResponse(result.insertId);
    res.status(201).json(authPayload);
}));

app.post('/api/auth/login', asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new AppError('Email and password are required', 400);
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const [[user]] = await db.query(
        'SELECT id, email, password_hash, status FROM users WHERE email = ? LIMIT 1',
        [normalizedEmail]
    );

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        throw new AppError('Invalid email or password', 401);
    }

    if (user.status !== 'Active') {
        throw new AppError(`This account is ${String(user.status).toLowerCase()}`, 403);
    }

    await db.query('UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE id = ?', [user.id]);
    await persistAuthenticatedSessionSafely(req, user.id);
    const authPayload = await createAuthResponse(user.id);
    res.json(authPayload);
}));

app.post('/api/auth/logout', asyncHandler(async (req, res) => {
    await destroyAuthenticatedSession(req);
    res.clearCookie(SESSION_COOKIE_NAME, {
        httpOnly: sessionCookieConfig.httpOnly,
        secure: sessionCookieConfig.secure,
        sameSite: sessionCookieConfig.sameSite
    });
    res.json({ success: true });
}));

app.get('/api/auth/me', requireAuth, asyncHandler(async (req, res) => {
    const user = await getAuthUserById(req.authUserId);
    res.json(user);
}));

app.put('/api/auth/profile', requireAuth, upload.single('profile_picture'), asyncHandler(async (req, res) => {
    const { name, email, password, profile_picture_url } = req.body;

    if (!name || !email) {
        await cleanupManagedUpload(req.file?.path);
        throw new AppError('Name and email are required', 400);
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const [[existingUser]] = await db.query(
        'SELECT profile_picture_url FROM users WHERE id = ? LIMIT 1',
        [req.authUserId]
    );
    const [[duplicateUser]] = await db.query(
        'SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1',
        [normalizedEmail, req.authUserId]
    );

    if (duplicateUser) {
        await cleanupManagedUpload(req.file?.path);
        throw new AppError('An account with that email already exists', 409);
    }

    const updateData = {
        name: String(name).trim(),
        email: normalizedEmail
    };

    if (password) {
        updateData.password_hash = await bcrypt.hash(password, 10);
    }

    if (req.file) {
        updateData.profile_picture_url = normalizePath(req.file.path);
    } else if (profile_picture_url !== undefined) {
        updateData.profile_picture_url = normalizeProfilePictureUrl(profile_picture_url);
    }

    await db.query('UPDATE users SET ?, updated_at = NOW() WHERE id = ?', [updateData, req.authUserId]);
    if (updateData.profile_picture_url !== undefined && existingUser?.profile_picture_url !== updateData.profile_picture_url) {
        await cleanupManagedUpload(existingUser.profile_picture_url);
    }
    const user = await getAuthUserById(req.authUserId);
    res.json(user);
}));

app.use('/api', (req, res, next) => {
    const isPublicReferenceData =
        req.method === 'GET' &&
        (req.path === '/roles' || req.path === '/departments');

    if (isPublicReferenceData) {
        next();
        return;
    }

    requireAuth(req, res, next);
});

// --- COMPANY ROUTES ---
app.get('/api/companies', asyncHandler(async (req, res) => {
    const includeInactive = ['1', 'true', 'yes'].includes(String(req.query.include_inactive || '').toLowerCase());
    const [rows] = await db.query(`
        SELECT ${COMPANY_SELECT_FIELDS}
        FROM companies
        ${includeInactive ? '' : `WHERE status <> 'inactive'`}
        ORDER BY created_at DESC
    `);
    res.json(rows.map(mapCompanyRow));
}));

app.post('/api/company', upload.single('logo'), asyncHandler(async (req, res) => {
    let companyData;
    try {
        companyData = buildCompanyPayload(req.body, { isCreate: true });
    } catch (error) {
        await cleanupManagedUpload(req.file?.path);
        throw error;
    }
    if (req.file) {
        companyData.logo_url = normalizePath(req.file.path);
    }
    const [result] = await db.query('INSERT INTO companies SET ?', [companyData]);
    await ensureDefaultAccounts(result.insertId);
    await createNotification(result.insertId, {
        title: 'Company workspace created',
        message: `${companyData.name} is now ready for use.`,
        type: 'info',
        priority: 'low',
        action_url: '/company-profile'
    });
    const company = await getCompanyById(result.insertId);
    res.status(201).json(company);
}));

app.get('/api/company/:id', asyncHandler(async (req, res) => {
    const companyId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(companyId)) {
        throw new AppError('Invalid company ID', 400);
    }

    const company = await getCompanyById(companyId);
    res.json(company);
}));

app.put('/api/company/:id', upload.single('logo'), asyncHandler(async (req, res) => {
    const companyId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(companyId)) {
        await cleanupManagedUpload(req.file?.path);
        throw new AppError('Invalid company ID', 400);
    }

    const existingCompany = await getCompanyById(companyId);
    let updateData;
    try {
        updateData = buildCompanyPayload(req.body, { allowEmpty: Boolean(req.file) });
    } catch (error) {
        await cleanupManagedUpload(req.file?.path);
        throw error;
    }
    if (req.file) {
        updateData.logo_url = normalizePath(req.file.path);
    }
    await db.query('UPDATE companies SET ?, updated_at = NOW() WHERE id = ?', [updateData, companyId]);
    if (updateData.logo_url !== undefined && existingCompany.logo_url !== updateData.logo_url) {
        await cleanupManagedUpload(existingCompany.logo_url);
    }
    const company = await getCompanyById(companyId);
    res.json(company);
}));

app.delete('/api/company/:id', asyncHandler(async (req, res) => {
    const companyId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(companyId)) {
        throw new AppError('Invalid company ID', 400);
    }

    const company = await getCompanyById(companyId);
    await db.query('UPDATE companies SET status = ?, updated_at = NOW() WHERE id = ?', ['inactive', companyId]);
    const archivedCompany = await getCompanyById(companyId);

    res.json({
        success: true,
        message: `${company.name} archived successfully`,
        company: archivedCompany
    });
}));

app.get('/api/company/:companyId/notifications', validateCompany, asyncHandler(async (req, res) => {
    const [rows] = await db.query(
        `SELECT *
         FROM notifications
         WHERE company_id = ?
         ORDER BY is_read ASC, created_at DESC`,
        [req.companyId]
    );

    const notifications = rows.map(formatNotificationRecord);
    res.json({
        notifications,
        unreadCount: notifications.filter((notification) => !notification.is_read).length
    });
}));

app.post('/api/company/:companyId/notifications', validateCompany, asyncHandler(async (req, res) => {
    const notification = await createNotification(req.companyId, req.body);
    res.status(201).json(notification);
}));

app.patch('/api/company/:companyId/notifications/:notificationId/read', validateCompany, asyncHandler(async (req, res) => {
    const [result] = await db.query(
        `UPDATE notifications
         SET is_read = 1, updated_at = NOW()
         WHERE id = ? AND company_id = ?`,
        [req.params.notificationId, req.companyId]
    );

    if (result.affectedRows === 0) {
        throw new AppError('Notification not found', 404);
    }

    const [[notification]] = await db.query(
        'SELECT * FROM notifications WHERE id = ? AND company_id = ? LIMIT 1',
        [req.params.notificationId, req.companyId]
    );

    res.json(formatNotificationRecord(notification));
}));

// --- MEMBER ROUTES (UNIFIED REGISTRY) ---
app.get('/api/company/:companyId/members', validateCompany, asyncHandler(async (req, res) => {
    const [rows] = await db.query(
        'SELECT * FROM company_members WHERE company_id = ? ORDER BY join_date DESC, created_at DESC',
        [req.companyId]
    );
    res.json(rows.map((row) => ({
        ...row,
        role: row.role || row.member_type || null,
        shares_held: toNumber(row.shares_held)
    })));
}));

app.post('/api/company/:companyId/members', upload.single('file'), validateCompany, asyncHandler(async (req, res) => {
    const memberData = {
        company_id: req.companyId,
        name: normalizeRequiredString(req.body.name, 'Member name'),
        role: normalizeOptionalString(req.body.role ?? req.body.member_type),
        nationality: normalizeOptionalString(req.body.nationality),
        national_id: normalizeOptionalString(req.body.national_id),
        email: normalizeOptionalEmail(req.body.email),
        phone: normalizeOptionalString(req.body.phone),
        address: normalizeOptionalString(req.body.address),
        shares_held: toNumber(req.body.shares_held),
        is_beneficial_owner: ['1', 'true', 'yes'].includes(String(req.body.is_beneficial_owner || '').toLowerCase()) ? 1 : 0,
        document_path: normalizePath(req.file?.path),
        join_date: req.body.join_date || getTodayDate(),
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
        ...(req.body.name !== undefined && { name: normalizeRequiredString(req.body.name, 'Member name') }),
        ...(req.body.role !== undefined || req.body.member_type !== undefined
            ? { role: normalizeOptionalString(req.body.role ?? req.body.member_type) }
            : {}),
        ...(req.body.nationality !== undefined && { nationality: normalizeOptionalString(req.body.nationality) }),
        ...(req.body.national_id !== undefined && { national_id: normalizeOptionalString(req.body.national_id) }),
        ...(req.body.email !== undefined && { email: normalizeOptionalEmail(req.body.email) }),
        ...(req.body.phone !== undefined && { phone: normalizeOptionalString(req.body.phone) }),
        ...(req.body.address !== undefined && { address: normalizeOptionalString(req.body.address) }),
        ...(req.body.shares_held !== undefined && { shares_held: toNumber(req.body.shares_held) }),
        ...(req.body.is_beneficial_owner !== undefined && {
            is_beneficial_owner: ['1', 'true', 'yes'].includes(String(req.body.is_beneficial_owner).toLowerCase()) ? 1 : 0
        }),
        ...(req.body.join_date !== undefined && { join_date: normalizeDateOnly(req.body.join_date, 'Join date') }),
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
app.get('/api/company/:companyId/documents', validateCompany, asyncHandler(async (req, res) => {
    const [rows] = await db.query(
        'SELECT * FROM company_documents WHERE company_id = ? ORDER BY id DESC',
        [req.companyId]
    );
    res.json(rows);
}));

app.post('/api/company/:companyId/upload', upload.single('file'), validateCompany, asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError('No file provided', 400);
    const [result] = await db.query('INSERT INTO company_documents SET ?', {
        company_id: req.companyId, name: req.file.originalname, file_path: normalizePath(req.file.path)
    });
    const [[doc]] = await db.query('SELECT * FROM company_documents WHERE id = ?', [result.insertId]);
    res.status(201).json(doc);
}));

app.delete('/api/company/:companyId/documents/:documentId', validateCompany, asyncHandler(async (req, res) => {
    const [[doc]] = await db.query(
        'SELECT id, file_path FROM company_documents WHERE id = ? AND company_id = ? LIMIT 1',
        [req.params.documentId, req.companyId]
    );

    if (!doc) {
        throw new AppError('Document not found', 404);
    }

    await db.query('DELETE FROM company_documents WHERE id = ? AND company_id = ?', [req.params.documentId, req.companyId]);
    await safeDelete(doc.file_path);
    res.json({ success: true });
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
    const [rows] = await db.query(`
        SELECT
            sc.*,
            COALESCE(sc.holder_name, cm.name) AS holder_name
        FROM share_certificates sc
        LEFT JOIN company_members cm ON cm.id = sc.member_id
        WHERE sc.company_id = ?
        ORDER BY sc.issue_date DESC, sc.created_at DESC
    `, [req.companyId]);
    res.json(rows);
}));

app.post('/api/company/:companyId/certificates', validateCompany, asyncHandler(async (req, res) => {
    const certificateNo = normalizeRequiredString(req.body.certificate_no ?? req.body.certificate_number, 'Certificate number');
    const holderName = normalizeRequiredString(req.body.holder_name, 'Holder name');
    const issueDate = normalizeDateOnly(req.body.issue_date, 'Issue date');
    const sharesCount = toNumber(req.body.shares_count);

    if (!sharesCount || sharesCount <= 0) {
        throw new AppError('Shares count must be greater than zero', 400);
    }

    let resolvedMemberId = req.body.member_id ? Number(req.body.member_id) : null;
    if (!resolvedMemberId) {
        const [[member]] = await db.query(
            'SELECT id FROM company_members WHERE company_id = ? AND name = ? LIMIT 1',
            [req.companyId, holderName]
        );
        resolvedMemberId = member ? Number(member.id) : null;
    }

    const [result] = await db.query('INSERT INTO share_certificates SET ?', {
        company_id: req.companyId,
        member_id: resolvedMemberId,
        certificate_no: certificateNo,
        holder_name: holderName,
        shares_count: sharesCount,
        issue_date: issueDate,
        status: normalizeOptionalString(req.body.status) || 'active',
        notes: normalizeOptionalString(req.body.notes)
    });
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
            je.entry_date AS date,
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
        LEFT JOIN supporting_documents sd ON sd.journal_entry_id = je.id AND sd.company_id = je.company_id
        WHERE je.company_id = ?
        ORDER BY je.entry_date DESC, je.created_at DESC, gl.id DESC
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
               je.entry_date AS date,
               (SELECT SUM(debit) FROM general_ledger WHERE journal_entry_id = je.id) as total_amount
        FROM journal_entries je 
        WHERE je.company_id = ? 
        ORDER BY je.entry_date DESC, je.created_at DESC`, 
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
            entry_date: date,
            description,
            entry_type: entryType || 'manual',
            reference_no: reference_no || null
        });

        const journalId = jeResult.insertId;

        await conn.query('INSERT INTO general_ledger SET ?', {
            company_id: req.companyId,
            journal_entry_id: journalId,
            account_id: Number(account_id),
            debit: debitValue,
            credit: creditValue
        });

        await conn.query('INSERT INTO general_ledger SET ?', {
            company_id: req.companyId,
            journal_entry_id: journalId,
            account_id: Number(offset_account_id),
            debit: creditValue,
            credit: debitValue
        });

        if (req.file) {
            await conn.query('INSERT INTO supporting_documents SET ?', {
                company_id: req.companyId,
                journal_entry_id: journalId,
                file_name: req.file.originalname,
                file_path: normalizePath(req.file.path)
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
            entry_date: date,
            description,
            entry_type: source_type || 'manual',
            reference_no: reference || null
        });
        const journalId = jeResult.insertId;

        for (const line of entries) {
            const account = await ensureAccountByCode(req.companyId, line, conn);
            await conn.query('INSERT INTO general_ledger SET ?', {
                company_id: req.companyId,
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
            entry_date: date,
            description,
            entry_type: entryType,
            reference_no: req.body.reference_no || null
        });
        const journalId = jeResult.insertId;

        await conn.query('INSERT INTO general_ledger SET ?', {
            company_id: req.companyId,
            journal_entry_id: journalId,
            account_id: account_id,
            debit: debit || 0,
            credit: credit || 0
        });

        await conn.query('INSERT INTO general_ledger SET ?', {
            company_id: req.companyId,
            journal_entry_id: journalId,
            account_id: offset_account_id,
            debit: credit || 0,
            credit: debit || 0
        });

        if (req.file) {
            await conn.query('INSERT INTO supporting_documents SET ?', {
                company_id: req.companyId,
                journal_entry_id: journalId,
                file_name: req.file.originalname,
                file_path: normalizePath(req.file.path)
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
    const asOfDate = req.query.as_of ? String(req.query.as_of) : null;
    const [rows] = await db.query(`
        SELECT a.name, a.code, a.category,
               COALESCE(SUM(CASE WHEN ? IS NULL OR je.entry_date <= ? THEN gl.debit ELSE 0 END), 0) as total_debit,
               COALESCE(SUM(CASE WHEN ? IS NULL OR je.entry_date <= ? THEN gl.credit ELSE 0 END), 0) as total_credit,
               COALESCE(SUM(CASE WHEN ? IS NULL OR je.entry_date <= ? THEN gl.debit - gl.credit ELSE 0 END), 0) as net_balance
        FROM accounts a
        LEFT JOIN general_ledger gl ON a.id = gl.account_id
        LEFT JOIN journal_entries je ON je.id = gl.journal_entry_id
        WHERE a.company_id = ?
        GROUP BY a.id`, 
        [asOfDate, asOfDate, asOfDate, asOfDate, asOfDate, asOfDate, req.companyId]
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

// 14. GET Fixed Assets Register
app.get('/api/company/:companyId/fixed-assets', validateCompany, asyncHandler(async (req, res) => {
    const [rows] = await db.query(
        'SELECT * FROM fixed_assets WHERE company_id = ? ORDER BY acquisition_date DESC, created_at DESC',
        [req.companyId]
    );

    const records = rows.map(formatFixedAssetRecord);
    const summary = {
        totalAssets: records.length,
        totalOriginalCost: records.reduce((sum, record) => sum + record.acquisition_cost, 0),
        activeAssets: records.filter((record) => record.status === 'active').length,
        retiredAssets: records.filter((record) => record.status !== 'active').length
    };

    res.json({ records, summary });
}));

// 15. POST Fixed Asset
app.post('/api/company/:companyId/fixed-assets', validateCompany, asyncHandler(async (req, res) => {
    const {
        name,
        category,
        acquisition_date,
        acquisition_cost,
        depreciation_method,
        useful_life_years,
        residual_value,
        location,
        supplier,
        status
    } = req.body;

    if (!name || !category || !acquisition_date || !acquisition_cost || !useful_life_years) {
        throw new AppError('Name, category, acquisition date, acquisition cost, and useful life are required', 400);
    }

    const assetData = {
        company_id: req.companyId,
        name: name.trim(),
        category: category.trim(),
        acquisition_date,
        acquisition_cost: toNumber(acquisition_cost),
        depreciation_method: depreciation_method || 'straight_line',
        useful_life_years: toNumber(useful_life_years),
        residual_value: toNumber(residual_value),
        location: location ? location.trim() : null,
        supplier: supplier ? supplier.trim() : null,
        status: status || 'active'
    };

    const [result] = await db.query('INSERT INTO fixed_assets SET ?', assetData);
    const [[saved]] = await db.query('SELECT * FROM fixed_assets WHERE id = ?', [result.insertId]);
    res.status(201).json(formatFixedAssetRecord(saved));
}));

// 16. PATCH Retire / Dispose Fixed Asset
app.patch('/api/company/:companyId/fixed-assets/:assetId/retire', validateCompany, asyncHandler(async (req, res) => {
    const { assetId } = req.params;
    const { retirement_date, disposal_amount, status } = req.body;

    const normalizedStatus =
        disposal_amount !== undefined && disposal_amount !== null && disposal_amount !== ''
            ? 'disposed'
            : status || 'retired';

    const [result] = await db.query(
        `UPDATE fixed_assets
         SET status = ?, retirement_date = ?, disposal_amount = ?, updated_at = NOW()
         WHERE id = ? AND company_id = ?`,
        [
            normalizedStatus,
            retirement_date || getTodayDate(),
            disposal_amount === undefined || disposal_amount === null || disposal_amount === '' ? null : toNumber(disposal_amount),
            assetId,
            req.companyId
        ]
    );

    if (result.affectedRows === 0) {
        throw new AppError('Fixed asset not found', 404);
    }

    const [[saved]] = await db.query('SELECT * FROM fixed_assets WHERE id = ? AND company_id = ?', [assetId, req.companyId]);
    res.json(formatFixedAssetRecord(saved));
}));

// 17. GET Client & Supplier Register
app.get('/api/company/:companyId/client-suppliers', validateCompany, asyncHandler(async (req, res) => {
    const [rows] = await db.query(
        'SELECT * FROM client_supplier_registers WHERE company_id = ? ORDER BY created_at DESC',
        [req.companyId]
    );

    const summary = {
        totalContacts: rows.length,
        clients: rows.filter((record) => record.type === 'client').length,
        suppliers: rows.filter((record) => record.type === 'supplier').length,
        active: rows.filter((record) => record.status === 'Active').length
    };

    res.json({ records: rows, summary });
}));

// 18. POST Client / Supplier Register Entry
app.post('/api/company/:companyId/client-suppliers', upload.single('file'), validateCompany, asyncHandler(async (req, res) => {
    const {
        name,
        type,
        category,
        tax_id,
        contact_person,
        phone,
        email,
        status
    } = req.body;

    if (!name || !type || !category || !tax_id || !phone || !email) {
        throw new AppError('Name, type, category, tax ID, phone, and email are required', 400);
    }

    const recordData = {
        company_id: req.companyId,
        name: name.trim(),
        type: String(type).toLowerCase(),
        category: String(category).toLowerCase(),
        tax_id: tax_id.trim(),
        contact_person: contact_person ? contact_person.trim() : null,
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        agreement_file_name: req.file?.originalname || null,
        agreement_file_path: normalizePath(req.file?.path),
        status: status || 'Active'
    };

    const [result] = await db.query('INSERT INTO client_supplier_registers SET ?', recordData);
    const [[saved]] = await db.query('SELECT * FROM client_supplier_registers WHERE id = ?', [result.insertId]);
    res.status(201).json(saved);
}));

// 19. GET Tax Returns Register
app.get('/api/company/:companyId/tax-returns', validateCompany, asyncHandler(async (req, res) => {
    const [rows] = await db.query(
        'SELECT * FROM tax_returns WHERE company_id = ? ORDER BY due_date DESC, created_at DESC',
        [req.companyId]
    );

    const records = rows.map(formatTaxReturnRecord);
    const summary = {
        totalReturns: records.length,
        filedReturns: records.filter((record) => record.status === 'Filed').length,
        pendingReturns: records.filter((record) => record.status === 'Pending').length,
        overdueReturns: records.filter((record) => record.status === 'Overdue').length,
        totalDeclared: records.reduce((sum, record) => sum + record.total_declared, 0)
    };

    res.json({ records, summary });
}));

// 20. POST Tax Return Record
app.post('/api/company/:companyId/tax-returns', validateCompany, asyncHandler(async (req, res) => {
    const {
        tax_type,
        period,
        submission_date,
        total_declared,
        status,
        due_date,
        quarter,
        tax_year,
        payload
    } = req.body;

    if (!tax_type || !period || !due_date) {
        throw new AppError('Tax type, period, and due date are required', 400);
    }
    const normalizedStatus = resolveTaxReturnStatus(status, due_date, submission_date);
    const recordData = {
        company_id: req.companyId,
        tax_type: String(tax_type).toUpperCase(),
        period: String(period),
        submission_date: normalizedStatus === 'Filed' ? submission_date || getTodayDate() : submission_date || null,
        total_declared: toNumber(total_declared),
        status: normalizedStatus,
        due_date,
        quarter: quarter || null,
        tax_year: tax_year || null,
        payload_json: payload ? JSON.stringify(payload) : null
    };

    const [existing] = await db.query(
        `SELECT id
         FROM tax_returns
         WHERE company_id = ?
           AND tax_type = ?
           AND period = ?
           AND COALESCE(quarter, '') = COALESCE(?, '')
           AND COALESCE(tax_year, '') = COALESCE(?, '')
         LIMIT 1`,
        [req.companyId, recordData.tax_type, recordData.period, recordData.quarter, recordData.tax_year]
    );

    let savedId;

    if (existing.length) {
        savedId = existing[0].id;
        await db.query('UPDATE tax_returns SET ? WHERE id = ? AND company_id = ?', [recordData, savedId, req.companyId]);
    } else {
        const [result] = await db.query('INSERT INTO tax_returns SET ?', recordData);
        savedId = result.insertId;
    }

    const [[saved]] = await db.query('SELECT * FROM tax_returns WHERE id = ? AND company_id = ?', [savedId, req.companyId]);
    res.status(existing.length ? 200 : 201).json(formatTaxReturnRecord(saved));
}));

// 21. PATCH Mark Tax Return as Filed
app.patch('/api/company/:companyId/tax-returns/:returnId/filed', validateCompany, asyncHandler(async (req, res) => {
    const submissionDate = req.body.submission_date || getTodayDate();

    const [result] = await db.query(
        `UPDATE tax_returns
         SET status = 'Filed', submission_date = ?, updated_at = NOW()
         WHERE id = ? AND company_id = ?`,
        [submissionDate, req.params.returnId, req.companyId]
    );

    if (result.affectedRows === 0) {
        throw new AppError('Tax return not found', 404);
    }

    const [[saved]] = await db.query('SELECT * FROM tax_returns WHERE id = ? AND company_id = ?', [req.params.returnId, req.companyId]);
    res.json(formatTaxReturnRecord(saved));
}));

app.get('/api/company/:companyId/employees', validateCompany, asyncHandler(async (req, res) => {
    const [rows] = await db.query(
        'SELECT * FROM employees WHERE company_id = ? ORDER BY created_at DESC',
        [req.companyId]
    );

    const records = rows.map(formatEmployeeRecord);
    const summary = {
        totalEmployees: records.length,
        activeEmployees: records.filter((employee) => employee.status === 'active').length,
        inactiveEmployees: records.filter((employee) => employee.status === 'inactive').length,
        terminatedEmployees: records.filter((employee) => employee.status === 'terminated').length,
        averageSalary: records.length
            ? records.reduce((sum, employee) => sum + employee.gross_salary, 0) / records.length
            : 0
    };

    res.json({ records, summary });
}));

app.post('/api/company/:companyId/employees', upload.single('contract'), validateCompany, asyncHandler(async (req, res) => {
    const {
        full_name,
        email,
        phone,
        national_id,
        position,
        department,
        start_date,
        gross_salary,
        rssb_number,
        status
    } = req.body;

    if (!full_name || !national_id || !position || !department || !start_date || gross_salary === undefined) {
        throw new AppError('Full name, national ID, position, department, start date, and gross salary are required', 400);
    }

    const employeeData = {
        company_id: req.companyId,
        full_name: String(full_name).trim(),
        email: email ? String(email).trim().toLowerCase() : null,
        phone: phone ? String(phone).trim() : null,
        national_id: String(national_id).trim(),
        position: String(position).trim(),
        department: String(department).trim(),
        start_date,
        gross_salary: toNumber(gross_salary),
        rssb_number: rssb_number ? String(rssb_number).trim() : null,
        status: status || 'active',
        contract_file_name: req.file?.originalname || null,
        contract_file_path: normalizePath(req.file?.path)
    };

    const [result] = await db.query('INSERT INTO employees SET ?', employeeData);
    const [[saved]] = await db.query('SELECT * FROM employees WHERE id = ? AND company_id = ?', [result.insertId, req.companyId]);
    res.status(201).json(formatEmployeeRecord(saved));
}));

app.put('/api/company/:companyId/employees/:employeeId', upload.single('contract'), validateCompany, asyncHandler(async (req, res) => {
    const [[existing]] = await db.query(
        'SELECT contract_file_path FROM employees WHERE id = ? AND company_id = ?',
        [req.params.employeeId, req.companyId]
    );

    if (!existing) {
        throw new AppError('Employee not found', 404);
    }

    const updateData = {
        ...(req.body.full_name && { full_name: String(req.body.full_name).trim() }),
        ...(req.body.email !== undefined && { email: req.body.email ? String(req.body.email).trim().toLowerCase() : null }),
        ...(req.body.phone !== undefined && { phone: req.body.phone ? String(req.body.phone).trim() : null }),
        ...(req.body.national_id && { national_id: String(req.body.national_id).trim() }),
        ...(req.body.position && { position: String(req.body.position).trim() }),
        ...(req.body.department && { department: String(req.body.department).trim() }),
        ...(req.body.start_date && { start_date: req.body.start_date }),
        ...(req.body.gross_salary !== undefined && { gross_salary: toNumber(req.body.gross_salary) }),
        ...(req.body.rssb_number !== undefined && { rssb_number: req.body.rssb_number ? String(req.body.rssb_number).trim() : null }),
        ...(req.body.status && { status: req.body.status }),
        ...(req.file && {
            contract_file_name: req.file.originalname,
            contract_file_path: normalizePath(req.file.path)
        })
    };

    await db.query('UPDATE employees SET ?, updated_at = NOW() WHERE id = ? AND company_id = ?', [
        updateData,
        req.params.employeeId,
        req.companyId
    ]);

    if (req.file && existing.contract_file_path) {
        await safeDelete(existing.contract_file_path);
    }

    const [[saved]] = await db.query('SELECT * FROM employees WHERE id = ? AND company_id = ?', [req.params.employeeId, req.companyId]);
    res.json(formatEmployeeRecord(saved));
}));

app.patch('/api/company/:companyId/employees/:employeeId/status', validateCompany, asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!['active', 'inactive', 'terminated'].includes(status)) {
        throw new AppError('Invalid employee status', 400);
    }

    const [result] = await db.query(
        'UPDATE employees SET status = ?, updated_at = NOW() WHERE id = ? AND company_id = ?',
        [status, req.params.employeeId, req.companyId]
    );

    if (result.affectedRows === 0) {
        throw new AppError('Employee not found', 404);
    }

    const [[saved]] = await db.query('SELECT * FROM employees WHERE id = ? AND company_id = ?', [req.params.employeeId, req.companyId]);
    res.json(formatEmployeeRecord(saved));
}));

app.get('/api/company/:companyId/payroll-records', validateCompany, asyncHandler(async (req, res) => {
    const params = [req.companyId];
    let sql = PAYROLL_RECORD_SELECT;

    if (req.query.month) {
        sql += ' AND pr.payroll_month = ?';
        params.push(req.query.month);
    }

    sql += ' ORDER BY pr.payroll_month DESC, e.full_name ASC';

    const [rows] = await db.query(sql, params);
    const records = rows.map(formatPayrollRecord);
    const summary = buildPayrollSummary(records, req.query.month ? String(req.query.month) : undefined);

    res.json({ records, summary });
}));

app.post('/api/company/:companyId/payroll-records/generate', validateCompany, asyncHandler(async (req, res) => {
    const payrollMonth = String(req.body.payroll_month || '').trim();
    const payDate = req.body.pay_date || getTodayDate();

    if (!/^\d{4}-\d{2}$/.test(payrollMonth)) {
        throw new AppError('Payroll month must be in YYYY-MM format', 400);
    }

    const [[postedMonth]] = await db.query(
        `SELECT accounting_journal_id
         FROM payroll_records
         WHERE company_id = ? AND payroll_month = ? AND accounting_journal_id IS NOT NULL
         LIMIT 1`,
        [req.companyId, payrollMonth]
    );

    if (postedMonth) {
        throw new AppError('Payroll for this month has already been posted to accounting and cannot be regenerated', 409);
    }

    const [employees] = await db.query(
        `SELECT *
         FROM employees
         WHERE company_id = ? AND status = 'active'
         ORDER BY full_name ASC`,
        [req.companyId]
    );

    if (!employees.length) {
        throw new AppError('No active employees found for payroll generation', 400);
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        for (const employee of employees) {
            const paye = calculatePaye(employee.gross_salary);
            const rssb = calculateRssb(employee.gross_salary);
            const grossSalary = toNumber(employee.gross_salary);
            const netSalary = grossSalary - paye - rssb.employee;

            const existingValues = {
                pay_date: payDate,
                gross_salary: grossSalary,
                paye_tax: paye,
                rssb_employee: rssb.employee,
                rssb_employer: rssb.employer,
                net_salary: netSalary,
                status: 'unpaid',
                paid_at: null,
                accounting_journal_id: null,
                accounting_posted_at: null
            };

            const [existingRows] = await connection.query(
                'SELECT id FROM payroll_records WHERE company_id = ? AND employee_id = ? AND payroll_month = ? LIMIT 1',
                [req.companyId, employee.id, payrollMonth]
            );

            if (existingRows.length) {
                await connection.query(
                    'UPDATE payroll_records SET ?, updated_at = NOW() WHERE id = ?',
                    [existingValues, existingRows[0].id]
                );
            } else {
                await connection.query('INSERT INTO payroll_records SET ?', {
                    company_id: req.companyId,
                    employee_id: employee.id,
                    payroll_month: payrollMonth,
                    ...existingValues
                });
            }
        }

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }

    const [rows] = await db.query(
        `${PAYROLL_RECORD_SELECT} AND pr.payroll_month = ? ORDER BY e.full_name ASC`,
        [req.companyId, payrollMonth]
    );

    const records = rows.map(formatPayrollRecord);
    const summary = buildPayrollSummary(records, payrollMonth);
    await createNotification(req.companyId, {
        title: 'Payroll generated',
        message: `Payroll for ${payrollMonth} was generated for ${records.length} employee(s).`,
        type: 'info',
        priority: 'medium',
        action_url: '/payroll-hr'
    });

    res.status(201).json({ records, summary });
}));

app.post('/api/company/:companyId/payroll-records/post-to-accounting', validateCompany, asyncHandler(async (req, res) => {
    const payrollMonth = String(req.body.payroll_month || '').trim();
    if (!/^\d{4}-\d{2}$/.test(payrollMonth)) {
        throw new AppError('Payroll month must be in YYYY-MM format', 400);
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await ensureDefaultAccounts(req.companyId, connection);

        const [rows] = await connection.query(
            `${PAYROLL_RECORD_SELECT} AND pr.payroll_month = ? ORDER BY e.full_name ASC`,
            [req.companyId, payrollMonth]
        );

        if (!rows.length) {
            throw new AppError('No payroll records found for the selected month', 404);
        }

        const records = rows.map(formatPayrollRecord);
        if (records.some((record) => record.accounting_journal_id)) {
            throw new AppError('Payroll for this month has already been posted to accounting', 409);
        }

        const summary = buildPayrollSummary(records, payrollMonth);
        const reference = `PAYROLL-${payrollMonth}`;
        const description = `Payroll accrual for ${payrollMonth}`;
        const payDate = records[0]?.pay_date || getTodayDate();

        const [journalResult] = await connection.query('INSERT INTO journal_entries SET ?', {
            company_id: req.companyId,
            entry_date: payDate,
            description,
            entry_type: 'payroll',
            reference_no: reference
        });

        const journalId = journalResult.insertId;
        const accountingLines = [
            { account_code: '5002', account_name: 'Salaries & Wages', debit: summary.totalGrossPay + summary.totalRssbEmployer, credit: 0 },
            { account_code: '2201', account_name: 'Accrued Expenses', debit: 0, credit: summary.totalNetPay },
            { account_code: '2102', account_name: 'PAYE Payable', debit: 0, credit: summary.totalPaye },
            {
                account_code: '2103',
                account_name: 'RSSB Payable',
                debit: 0,
                credit: summary.totalRssbEmployee + summary.totalRssbEmployer
            }
        ].filter((line) => Number(line.debit || 0) > 0 || Number(line.credit || 0) > 0);

        for (const line of accountingLines) {
            const account = await ensureAccountByCode(req.companyId, line, connection);
            await connection.query('INSERT INTO general_ledger SET ?', {
                company_id: req.companyId,
                journal_entry_id: journalId,
                account_id: account.id,
                debit: Number(line.debit || 0),
                credit: Number(line.credit || 0)
            });
        }

        await connection.query(
            `UPDATE payroll_records
             SET accounting_journal_id = ?, accounting_posted_at = NOW(), updated_at = NOW()
             WHERE company_id = ? AND payroll_month = ?`,
            [journalId, req.companyId, payrollMonth]
        );

        await createNotification(req.companyId, {
            title: 'Payroll posted to accounting',
            message: `Payroll for ${payrollMonth} has been posted to the accounting books.`,
            type: 'info',
            priority: 'medium',
            action_url: '/accounting-books'
        }, connection);

        await connection.commit();

        const [savedRows] = await db.query(
            `${PAYROLL_RECORD_SELECT} AND pr.payroll_month = ? ORDER BY e.full_name ASC`,
            [req.companyId, payrollMonth]
        );
        const savedRecords = savedRows.map(formatPayrollRecord);

        res.status(201).json({
            records: savedRecords,
            summary: buildPayrollSummary(savedRecords, payrollMonth),
            journalId,
            reference
        });
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}));

app.patch('/api/company/:companyId/payroll-records/:payrollId/paid', validateCompany, asyncHandler(async (req, res) => {
    const payrollId = Number.parseInt(req.params.payrollId, 10);
    if (Number.isNaN(payrollId)) {
        throw new AppError('Invalid payroll record ID', 400);
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        await ensureDefaultAccounts(req.companyId, connection);

        const [rows] = await connection.query(
            `${PAYROLL_RECORD_SELECT} AND pr.id = ? LIMIT 1`,
            [req.companyId, payrollId]
        );

        if (!rows.length) {
            throw new AppError('Payroll record not found', 404);
        }

        const record = formatPayrollRecord(rows[0]);
        if (!record.accounting_journal_id) {
            throw new AppError('Post this payroll month to accounting before marking it as paid', 409);
        }

        const paymentReference = `PAYROLL-PAY-${record.id}`;
        const [[existingPaymentJournal]] = await connection.query(
            'SELECT id FROM journal_entries WHERE company_id = ? AND reference_no = ? LIMIT 1',
            [req.companyId, paymentReference]
        );

        if (!existingPaymentJournal) {
            const paymentDate = getTodayDate();
            const [journalResult] = await connection.query('INSERT INTO journal_entries SET ?', {
                company_id: req.companyId,
                entry_date: paymentDate,
                description: `Payroll payment - ${record.employee?.full_name || 'Employee'} - ${record.payroll_month}`,
                entry_type: 'payment',
                reference_no: paymentReference
            });

            const paymentJournalId = journalResult.insertId;
            const accruedExpenseAccount = await ensureAccountByCode(req.companyId, {
                account_code: '2201',
                account_name: 'Accrued Expenses'
            }, connection);
            const cashAccount = await ensureAccountByCode(req.companyId, {
                account_code: '1001',
                account_name: 'Cash at Bank'
            }, connection);

            await connection.query('INSERT INTO general_ledger SET ?', {
                company_id: req.companyId,
                journal_entry_id: paymentJournalId,
                account_id: accruedExpenseAccount.id,
                debit: record.net_salary,
                credit: 0
            });
            await connection.query('INSERT INTO general_ledger SET ?', {
                company_id: req.companyId,
                journal_entry_id: paymentJournalId,
                account_id: cashAccount.id,
                debit: 0,
                credit: record.net_salary
            });
        }

        await connection.query(
            `UPDATE payroll_records
             SET status = 'paid', paid_at = COALESCE(paid_at, NOW()), updated_at = NOW()
             WHERE id = ? AND company_id = ?`,
            [payrollId, req.companyId]
        );

        await createNotification(req.companyId, {
            title: 'Payroll payment recorded',
            message: `${record.employee?.full_name || 'Employee'} was marked as paid for ${record.payroll_month}.`,
            type: 'info',
            priority: 'low',
            action_url: '/general-ledger'
        }, connection);

        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }

    const [[row]] = await db.query(
        `${PAYROLL_RECORD_SELECT} AND pr.id = ? LIMIT 1`,
        [req.companyId, payrollId]
    );

    res.json(formatPayrollRecord(row));
}));

app.get('/api/company/:companyId/internal-audit-reports', validateCompany, asyncHandler(async (req, res) => {
    const [rows] = await db.query(
        'SELECT * FROM internal_audit_reports WHERE company_id = ? ORDER BY created_at DESC',
        [req.companyId]
    );

    const records = rows.map(formatAuditReportRecord);
    const summary = {
        totalReports: records.length,
        completed: records.filter((record) => record.status === 'Completed').length,
        inProgress: records.filter((record) => record.status === 'In Progress').length,
        totalFindings: records.reduce((sum, record) => sum + record.findings_count, 0)
    };

    res.json({ records, summary });
}));

app.post('/api/company/:companyId/internal-audit-reports', upload.single('attachment'), validateCompany, asyncHandler(async (req, res) => {
    const {
        title,
        audit_type,
        auditor,
        audited_period,
        report_date,
        status,
        findings_count,
        description,
        recommendations
    } = req.body;

    if (!title || !audit_type || !auditor || !audited_period) {
        throw new AppError('Title, audit type, auditor, and audited period are required', 400);
    }

    const [result] = await db.query('INSERT INTO internal_audit_reports SET ?', {
        company_id: req.companyId,
        title: String(title).trim(),
        audit_type: String(audit_type).trim(),
        auditor: String(auditor).trim(),
        audited_period: String(audited_period).trim(),
        report_date: report_date || null,
        status: status || 'Scheduled',
        findings_count: Number(findings_count || 0),
        description: description || null,
        recommendations: recommendations || null,
        attachment_file_name: req.file?.originalname || null,
        attachment_file_path: normalizePath(req.file?.path)
    });

    const [[saved]] = await db.query('SELECT * FROM internal_audit_reports WHERE id = ? AND company_id = ?', [result.insertId, req.companyId]);
    res.status(201).json(formatAuditReportRecord(saved));
}));

app.put('/api/company/:companyId/internal-audit-reports/:reportId', upload.single('attachment'), validateCompany, asyncHandler(async (req, res) => {
    const [[existing]] = await db.query(
        'SELECT attachment_file_path FROM internal_audit_reports WHERE id = ? AND company_id = ?',
        [req.params.reportId, req.companyId]
    );

    if (!existing) {
        throw new AppError('Audit report not found', 404);
    }

    await db.query('UPDATE internal_audit_reports SET ?, updated_at = NOW() WHERE id = ? AND company_id = ?', [{
        ...(req.body.title && { title: String(req.body.title).trim() }),
        ...(req.body.audit_type && { audit_type: String(req.body.audit_type).trim() }),
        ...(req.body.auditor && { auditor: String(req.body.auditor).trim() }),
        ...(req.body.audited_period && { audited_period: String(req.body.audited_period).trim() }),
        ...(req.body.report_date !== undefined && { report_date: req.body.report_date || null }),
        ...(req.body.status && { status: req.body.status }),
        ...(req.body.findings_count !== undefined && { findings_count: Number(req.body.findings_count || 0) }),
        ...(req.body.description !== undefined && { description: req.body.description || null }),
        ...(req.body.recommendations !== undefined && { recommendations: req.body.recommendations || null }),
        ...(req.file && {
            attachment_file_name: req.file.originalname,
            attachment_file_path: normalizePath(req.file.path)
        })
    }, req.params.reportId, req.companyId]);

    if (req.file && existing.attachment_file_path) {
        await safeDelete(existing.attachment_file_path);
    }

    const [[saved]] = await db.query('SELECT * FROM internal_audit_reports WHERE id = ? AND company_id = ?', [req.params.reportId, req.companyId]);
    res.json(formatAuditReportRecord(saved));
}));

app.delete('/api/company/:companyId/internal-audit-reports/:reportId', validateCompany, asyncHandler(async (req, res) => {
    const [[existing]] = await db.query(
        'SELECT attachment_file_path FROM internal_audit_reports WHERE id = ? AND company_id = ?',
        [req.params.reportId, req.companyId]
    );

    if (!existing) {
        throw new AppError('Audit report not found', 404);
    }

    await db.query('DELETE FROM internal_audit_reports WHERE id = ? AND company_id = ?', [req.params.reportId, req.companyId]);
    await safeDelete(existing.attachment_file_path);
    res.json({ success: true });
}));

app.get('/api/company/:companyId/complaint-risk-issues', validateCompany, asyncHandler(async (req, res) => {
    const [rows] = await db.query(
        'SELECT * FROM complaint_risk_issues WHERE company_id = ? ORDER BY reported_date DESC, created_at DESC',
        [req.companyId]
    );

    const records = rows.map(formatComplaintRiskRecord);
    const summary = {
        totalIssues: records.length,
        openIssues: records.filter((record) => record.status === 'Open').length,
        inProgressIssues: records.filter((record) => record.status === 'In Progress').length,
        resolvedIssues: records.filter((record) => record.status === 'Resolved').length
    };

    res.json({ records, summary });
}));

app.post('/api/company/:companyId/complaint-risk-issues', validateCompany, asyncHandler(async (req, res) => {
    const {
        title,
        category,
        description,
        reported_date,
        assigned_to,
        priority,
        status,
        deadline
    } = req.body;

    if (!title || !category || !description) {
        throw new AppError('Title, category, and description are required', 400);
    }

    const [result] = await db.query('INSERT INTO complaint_risk_issues SET ?', {
        company_id: req.companyId,
        title: String(title).trim(),
        category: String(category).trim(),
        description: String(description).trim(),
        reported_date: reported_date || getTodayDate(),
        assigned_to: assigned_to ? String(assigned_to).trim() : null,
        priority: priority || 'Medium',
        status: status || 'Open',
        deadline: deadline || null
    });

    const [[saved]] = await db.query('SELECT * FROM complaint_risk_issues WHERE id = ? AND company_id = ?', [result.insertId, req.companyId]);
    res.status(201).json(formatComplaintRiskRecord(saved));
}));

app.put('/api/company/:companyId/complaint-risk-issues/:issueId', validateCompany, asyncHandler(async (req, res) => {
    const [result] = await db.query('UPDATE complaint_risk_issues SET ?, updated_at = NOW() WHERE id = ? AND company_id = ?', [{
        ...(req.body.title && { title: String(req.body.title).trim() }),
        ...(req.body.category && { category: String(req.body.category).trim() }),
        ...(req.body.description && { description: String(req.body.description).trim() }),
        ...(req.body.reported_date && { reported_date: req.body.reported_date }),
        ...(req.body.assigned_to !== undefined && { assigned_to: req.body.assigned_to ? String(req.body.assigned_to).trim() : null }),
        ...(req.body.priority && { priority: req.body.priority }),
        ...(req.body.status && { status: req.body.status }),
        ...(req.body.deadline !== undefined && { deadline: req.body.deadline || null })
    }, req.params.issueId, req.companyId]);

    if (result.affectedRows === 0) {
        throw new AppError('Issue not found', 404);
    }

    const [[saved]] = await db.query('SELECT * FROM complaint_risk_issues WHERE id = ? AND company_id = ?', [req.params.issueId, req.companyId]);
    res.json(formatComplaintRiskRecord(saved));
}));

app.delete('/api/company/:companyId/complaint-risk-issues/:issueId', validateCompany, asyncHandler(async (req, res) => {
    const [result] = await db.query(
        'DELETE FROM complaint_risk_issues WHERE id = ? AND company_id = ?',
        [req.params.issueId, req.companyId]
    );

    if (result.affectedRows === 0) {
        throw new AppError('Issue not found', 404);
    }

    res.json({ success: true });
}));

app.get('/api/company/:companyId/compliance-alerts', validateCompany, asyncHandler(async (req, res) => {
    const [rows] = await db.query(
        'SELECT * FROM compliance_alerts WHERE company_id = ? ORDER BY due_date ASC, created_at DESC',
        [req.companyId]
    );

    const records = rows.map(formatComplianceAlertRecord);
    const summary = {
        total: records.length,
        active: records.filter((record) => record.status === 'active').length,
        acknowledged: records.filter((record) => record.status === 'acknowledged').length,
        resolved: records.filter((record) => record.status === 'resolved').length,
        highPriority: records.filter((record) => record.severity === 'high' && record.status === 'active').length
    };

    res.json({ records, summary });
}));

app.post('/api/company/:companyId/compliance-alerts', validateCompany, asyncHandler(async (req, res) => {
    const {
        title,
        description,
        type,
        severity,
        status,
        alert_date,
        due_date,
        for_roles,
        is_read,
        created_by,
        source,
        action_required,
        snoozed_until
    } = req.body;

    if (!title || !description || !due_date) {
        throw new AppError('Title, description, and due date are required', 400);
    }

    const [result] = await db.query('INSERT INTO compliance_alerts SET ?', {
        company_id: req.companyId,
        title: String(title).trim(),
        description: String(description).trim(),
        type: type || 'custom',
        severity: severity || 'medium',
        status: status || 'active',
        alert_date: alert_date || getTodayDate(),
        due_date,
        for_roles_json: JSON.stringify(parseRolesValue(for_roles)),
        is_read: is_read ? 1 : 0,
        created_by: created_by || null,
        source: source || 'manual',
        action_required: action_required || null,
        snoozed_until: snoozed_until || null
    });

    const [[saved]] = await db.query('SELECT * FROM compliance_alerts WHERE id = ? AND company_id = ?', [result.insertId, req.companyId]);
    res.status(201).json(formatComplianceAlertRecord(saved));
}));

app.patch('/api/company/:companyId/compliance-alerts/:alertId/status', validateCompany, asyncHandler(async (req, res) => {
    const { status, snoozed_until, is_read } = req.body;
    if (!['active', 'acknowledged', 'resolved', 'snoozed'].includes(status)) {
        throw new AppError('Invalid alert status', 400);
    }

    const [result] = await db.query(
        'UPDATE compliance_alerts SET status = ?, snoozed_until = ?, is_read = ?, updated_at = NOW() WHERE id = ? AND company_id = ?',
        [status, snoozed_until || null, is_read ? 1 : 0, req.params.alertId, req.companyId]
    );

    if (result.affectedRows === 0) {
        throw new AppError('Alert not found', 404);
    }

    const [[saved]] = await db.query('SELECT * FROM compliance_alerts WHERE id = ? AND company_id = ?', [req.params.alertId, req.companyId]);
    res.json(formatComplianceAlertRecord(saved));
}));

app.get('/api/company/:companyId/compliance-calendar', validateCompany, asyncHandler(async (req, res) => {
    const [rows] = await db.query(
        'SELECT * FROM compliance_deadlines WHERE company_id = ? ORDER BY due_date ASC, created_at DESC',
        [req.companyId]
    );

    const records = rows.map(formatComplianceDeadlineRecord);
    const summary = {
        total: records.length,
        highPriority: records.filter((record) => record.priority === 'high').length,
        mediumPriority: records.filter((record) => record.priority === 'medium').length,
        completed: records.filter((record) => record.status === 'completed').length,
        overdue: records.filter((record) => record.status === 'overdue').length
    };

    res.json({ records, summary });
}));

app.post('/api/company/:companyId/compliance-calendar', validateCompany, asyncHandler(async (req, res) => {
    const { task, due_date, priority, department, description, status, reminder_days } = req.body;
    if (!task || !due_date || !department) {
        throw new AppError('Task, due date, and department are required', 400);
    }

    const [result] = await db.query('INSERT INTO compliance_deadlines SET ?', {
        company_id: req.companyId,
        task: String(task).trim(),
        due_date,
        priority: priority || 'medium',
        department: String(department).trim(),
        description: description || null,
        status: resolveDeadlineStatus(status, due_date),
        reminder_days: Number(reminder_days || 3)
    });

    const [[saved]] = await db.query('SELECT * FROM compliance_deadlines WHERE id = ? AND company_id = ?', [result.insertId, req.companyId]);
    res.status(201).json(formatComplianceDeadlineRecord(saved));
}));

app.put('/api/company/:companyId/compliance-calendar/:deadlineId', validateCompany, asyncHandler(async (req, res) => {
    const dueDate = req.body.due_date;
    const resolvedStatus = req.body.status ? resolveDeadlineStatus(req.body.status, dueDate) : undefined;
    const [result] = await db.query('UPDATE compliance_deadlines SET ?, updated_at = NOW() WHERE id = ? AND company_id = ?', [{
        ...(req.body.task && { task: String(req.body.task).trim() }),
        ...(req.body.due_date && { due_date: req.body.due_date }),
        ...(req.body.priority && { priority: req.body.priority }),
        ...(req.body.department && { department: String(req.body.department).trim() }),
        ...(req.body.description !== undefined && { description: req.body.description || null }),
        ...(resolvedStatus && { status: resolvedStatus }),
        ...(req.body.reminder_days !== undefined && { reminder_days: Number(req.body.reminder_days || 3) })
    }, req.params.deadlineId, req.companyId]);

    if (result.affectedRows === 0) {
        throw new AppError('Deadline not found', 404);
    }

    const [[saved]] = await db.query('SELECT * FROM compliance_deadlines WHERE id = ? AND company_id = ?', [req.params.deadlineId, req.companyId]);
    res.json(formatComplianceDeadlineRecord(saved));
}));

app.delete('/api/company/:companyId/compliance-calendar/:deadlineId', validateCompany, asyncHandler(async (req, res) => {
    const [result] = await db.query(
        'DELETE FROM compliance_deadlines WHERE id = ? AND company_id = ?',
        [req.params.deadlineId, req.companyId]
    );

    if (result.affectedRows === 0) {
        throw new AppError('Deadline not found', 404);
    }

    res.json({ success: true });
}));

app.get('/api/company/:companyId/document-vault', validateCompany, asyncHandler(async (req, res) => {
    const [rows] = await db.query(
        'SELECT * FROM document_vault WHERE company_id = ? ORDER BY created_at DESC',
        [req.companyId]
    );

    const records = rows.map(formatDocumentVaultRecord);
    const summary = {
        totalDocuments: records.length,
        securedDocuments: records.filter((record) => record.secured).length,
        categories: new Set(records.map((record) => record.category)).size
    };

    res.json({ records, summary });
}));

app.post('/api/company/:companyId/document-vault', upload.single('file'), validateCompany, asyncHandler(async (req, res) => {
    const { title, category, description, date_issued, access_role, uploaded_by, file_type } = req.body;
    if (!title || !category || !req.file) {
        throw new AppError('Title, category, and file are required', 400);
    }

    const [result] = await db.query('INSERT INTO document_vault SET ?', {
        company_id: req.companyId,
        title: String(title).trim(),
        category: String(category).trim(),
        description: description || null,
        date_issued: date_issued || null,
        access_role: access_role || 'all',
        file_name: req.file.originalname,
        file_path: normalizePath(req.file.path),
        file_size: Number(req.file.size || 0),
        uploaded_by: uploaded_by || null,
        secured: access_role && access_role !== 'all' ? 1 : 0,
        file_type: file_type || req.file.mimetype || null
    });

    const [[saved]] = await db.query('SELECT * FROM document_vault WHERE id = ? AND company_id = ?', [result.insertId, req.companyId]);
    res.status(201).json(formatDocumentVaultRecord(saved));
}));

app.delete('/api/company/:companyId/document-vault/:documentId', validateCompany, asyncHandler(async (req, res) => {
    const [[existing]] = await db.query(
        'SELECT file_path FROM document_vault WHERE id = ? AND company_id = ?',
        [req.params.documentId, req.companyId]
    );

    if (!existing) {
        throw new AppError('Document not found', 404);
    }

    await db.query('DELETE FROM document_vault WHERE id = ? AND company_id = ?', [req.params.documentId, req.companyId]);
    await safeDelete(existing.file_path);
    res.json({ success: true });
}));

app.get('/api/company/:companyId/settings', validateCompany, asyncHandler(async (req, res) => {
    const [[settings]] = await db.query(
        'SELECT * FROM company_settings WHERE company_id = ? LIMIT 1',
        [req.companyId]
    );

    res.json(buildSettingsResponse(settings));
}));

app.put('/api/company/:companyId/settings', validateCompany, asyncHandler(async (req, res) => {
    const payload = {
        company_id: req.companyId,
        general_json: JSON.stringify(req.body.general || defaultCompanySettings().general),
        notifications_json: JSON.stringify(req.body.notifications || defaultCompanySettings().notifications),
        security_json: JSON.stringify(req.body.security || defaultCompanySettings().security),
        integrations_json: JSON.stringify(req.body.integrations || defaultCompanySettings().integrations)
    };

    const [existing] = await db.query('SELECT id FROM company_settings WHERE company_id = ? LIMIT 1', [req.companyId]);
    if (existing.length) {
        await db.query('UPDATE company_settings SET ?, updated_at = NOW() WHERE company_id = ?', [payload, req.companyId]);
    } else {
        await db.query('INSERT INTO company_settings SET ?', payload);
    }

    const [[saved]] = await db.query('SELECT * FROM company_settings WHERE company_id = ? LIMIT 1', [req.companyId]);
    res.json(buildSettingsResponse(saved));
}));

app.get('/api/company/:companyId/system-health', validateCompany, asyncHandler(async (req, res) => {
    const [
        [transactionRows],
        [userRows],
        [taxRows],
        [alertRows],
        [recentJournals],
        [recentInvoices],
        [recentReturns],
        [recentAlerts]
    ] = await Promise.all([
        db.query(`
            SELECT
                COUNT(DISTINCT je.id) AS totalTransactions,
                COUNT(DISTINCT CASE WHEN sd.id IS NOT NULL THEN je.id END) AS documentedTransactions,
                COALESCE(SUM(gl.debit), 0) AS totalDebits,
                COALESCE(SUM(gl.credit), 0) AS totalCredits
            FROM journal_entries je
            LEFT JOIN general_ledger gl ON gl.journal_entry_id = je.id
            LEFT JOIN supporting_documents sd ON sd.journal_entry_id = je.id AND sd.company_id = je.company_id
            WHERE je.company_id = ?
        `, [req.companyId]),
        db.query(`
            SELECT
                COUNT(*) AS totalUsers,
                COALESCE(SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END), 0) AS activeUsers
            FROM users
        `),
        db.query(`
            SELECT
                COUNT(*) AS totalReturns,
                COALESCE(SUM(CASE WHEN status = 'Filed' THEN 1 ELSE 0 END), 0) AS filedReturns,
                COALESCE(SUM(CASE WHEN status <> 'Filed' THEN 1 ELSE 0 END), 0) AS pendingReturns,
                COALESCE(SUM(CASE WHEN status = 'Overdue' THEN 1 ELSE 0 END), 0) AS overdueReturns
            FROM tax_returns
            WHERE company_id = ?
        `, [req.companyId]),
        db.query(`
            SELECT
                COUNT(*) AS totalAlerts,
                COALESCE(SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END), 0) AS activeAlerts,
                COALESCE(SUM(CASE WHEN severity = 'high' AND status = 'active' THEN 1 ELSE 0 END), 0) AS criticalAlerts
            FROM compliance_alerts
            WHERE company_id = ?
        `, [req.companyId]),
        db.query(`
            SELECT id, entry_date, description, reference_no, created_at
            FROM journal_entries
            WHERE company_id = ?
            ORDER BY created_at DESC
            LIMIT 4
        `, [req.companyId]),
        db.query(`
            SELECT id, type, party_name, total, date, status, created_at
            FROM invoice
            WHERE company_id = ?
            ORDER BY created_at DESC
            LIMIT 4
        `, [req.companyId]),
        db.query(`
            SELECT id, tax_type, period, status, due_date, updated_at
            FROM tax_returns
            WHERE company_id = ?
            ORDER BY updated_at DESC
            LIMIT 4
        `, [req.companyId]),
        db.query(`
            SELECT id, title, severity, status, due_date, created_by, updated_at
            FROM compliance_alerts
            WHERE company_id = ?
            ORDER BY updated_at DESC
            LIMIT 4
        `, [req.companyId])
    ]);

    const transactionStats = transactionRows[0] || {};
    const userStats = userRows[0] || {};
    const taxStats = taxRows[0] || {};
    const alertStats = alertRows[0] || {};

    const totalTransactions = Number(transactionStats.totalTransactions || 0);
    const documentedTransactions = Number(transactionStats.documentedTransactions || 0);
    const totalDebits = Number(transactionStats.totalDebits || 0);
    const totalCredits = Number(transactionStats.totalCredits || 0);
    const balanceDifference = Math.abs(totalDebits - totalCredits);

    const totalUsers = Number(userStats.totalUsers || 0);
    const activeUsers = Number(userStats.activeUsers || 0);
    const totalReturns = Number(taxStats.totalReturns || 0);
    const filedReturns = Number(taxStats.filedReturns || 0);
    const pendingReturns = Number(taxStats.pendingReturns || 0);
    const overdueReturns = Number(taxStats.overdueReturns || 0);
    const activeAlerts = Number(alertStats.activeAlerts || 0);
    const criticalAlerts = Number(alertStats.criticalAlerts || 0);

    const ledgerBalanceScore = totalTransactions === 0
        ? 100
        : Math.max(0, Math.round(100 - Math.min(100, (balanceDifference / Math.max(totalDebits, 1)) * 100)));
    const complianceScoreBase = totalReturns === 0 ? 100 : Math.round((filedReturns / totalReturns) * 100);
    const complianceScore = Math.max(0, complianceScoreBase - criticalAlerts * 5 - overdueReturns * 10);
    const userCoverageScore = totalUsers === 0 ? 0 : Math.round((activeUsers / totalUsers) * 100);
    const documentationCoverageScore = totalTransactions === 0 ? 100 : Math.round((documentedTransactions / totalTransactions) * 100);

    const recentActivity = [
        ...recentJournals.map((entry) => ({
            id: `journal-${entry.id}`,
            category: 'journal',
            title: entry.reference_no || `JE-${String(entry.id).padStart(6, '0')}`,
            subtitle: entry.description,
            occurred_at: entry.created_at,
            status: 'posted',
            meta: entry.entry_date,
            actor: 'Accounting'
        })),
        ...recentInvoices.map((record) => ({
            id: `invoice-${record.id}`,
            category: record.type,
            title: `${record.type === 'invoice' ? 'Invoice' : 'Receipt'} ${record.id}`,
            subtitle: `${record.party_name} • ${Number(record.total || 0).toLocaleString()} RWF`,
            occurred_at: record.created_at,
            status: record.status,
            meta: record.date,
            actor: 'Billing'
        })),
        ...recentReturns.map((record) => ({
            id: `tax-${record.id}`,
            category: 'tax',
            title: `${record.tax_type} return`,
            subtitle: `${record.period} • ${record.status}`,
            occurred_at: record.updated_at,
            status: record.status,
            meta: record.due_date,
            actor: 'Tax'
        })),
        ...recentAlerts.map((record) => ({
            id: `alert-${record.id}`,
            category: 'alert',
            title: record.title,
            subtitle: `${record.severity} severity`,
            occurred_at: record.updated_at,
            status: record.status,
            meta: record.due_date,
            actor: record.created_by || 'System'
        }))
    ]
        .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
        .slice(0, 6);

    const recommendations = [];

    if (balanceDifference > 0.01) {
        recommendations.push({
            id: 'ledger-balance',
            severity: 'critical',
            title: 'Ledger is out of balance',
            description: `Debits and credits differ by ${balanceDifference.toFixed(2)} RWF. Review the latest journal entries.`
        });
    }

    if (pendingReturns > 0) {
        recommendations.push({
            id: 'tax-returns',
            severity: overdueReturns > 0 ? 'critical' : 'warning',
            title: overdueReturns > 0 ? 'Overdue tax returns detected' : 'Pending tax returns detected',
            description: `${pendingReturns} tax return(s) still require filing${overdueReturns > 0 ? `, including ${overdueReturns} overdue item(s)` : ''}.`
        });
    }

    if (activeAlerts > 0) {
        recommendations.push({
            id: 'alerts',
            severity: criticalAlerts > 0 ? 'warning' : 'info',
            title: 'Compliance alerts require review',
            description: `${activeAlerts} active compliance alert(s) are open${criticalAlerts > 0 ? `, including ${criticalAlerts} critical alert(s)` : ''}.`
        });
    }

    if (documentationCoverageScore < 70) {
        recommendations.push({
            id: 'documentation',
            severity: 'info',
            title: 'Supporting documents are incomplete',
            description: `Only ${documentationCoverageScore}% of journal entries have an attached document.`
        });
    }

    if (!recommendations.length) {
        recommendations.push({
            id: 'healthy',
            severity: 'success',
            title: 'System operating normally',
            description: 'Ledger, compliance, and user activity checks are within expected thresholds.'
        });
    }

    res.json({
        overview: {
            totalTransactions,
            activeUsers,
            activeAlerts,
            pendingReturns
        },
        health: {
            ledgerBalanceScore,
            complianceScore,
            userCoverageScore,
            documentationCoverageScore
        },
        recentActivity,
        recommendations
    });
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

app.put('/api/permissions/:id', asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (!name) throw new AppError('Permission name is required', 400);
    const [result] = await db.query('UPDATE permissions SET name = ? WHERE id = ?', [name.trim(), req.params.id]);
    if (result.affectedRows === 0) throw new AppError('Permission not found', 404);
    const [[perm]] = await db.query('SELECT * FROM permissions WHERE id = ?', [req.params.id]);
    res.json(perm);
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
            u.id, u.name, u.email, u.profile_picture_url, u.status, u.last_login, u.created_at,
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
        ...applyDefaultProfilePicture(u),
        permissions: u.permissions ? u.permissions.split(',') : []
    }));

    res.json(users);
}));

app.get('/api/users/:id', asyncHandler(async (req, res) => {
    const [[user]] = await db.query(`
        SELECT 
            u.id, u.name, u.email, u.profile_picture_url, u.status, u.last_login, u.created_at,
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

    res.json({ ...applyDefaultProfilePicture(user), permissions: perms.map(p => p.name) });
}));

app.post('/api/users', asyncHandler(async (req, res) => {
    const { name, email, password, role_id, department_id, status, permissions = [], profile_picture_url } = req.body;

    if (!name || !email || !password) throw new AppError('Name, email and password are required', 400);

    const password_hash = await bcrypt.hash(password, 10);

    const [result] = await db.query('INSERT INTO users SET ?', [{
        name: name.trim(),
        email: email.trim().toLowerCase(),
        profile_picture_url: normalizeProfilePictureUrl(profile_picture_url),
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

    const [[newUser]] = await db.query('SELECT id, name, email, profile_picture_url, status, created_at FROM users WHERE id = ?', [userId]);
    res.status(201).json(applyDefaultProfilePicture(newUser));
}));

app.put('/api/users/:id', asyncHandler(async (req, res) => {
    const { name, email, password, role_id, department_id, status, permissions, profile_picture_url } = req.body;

    const [[existing]] = await db.query('SELECT id FROM users WHERE id = ?', [req.params.id]);
    if (!existing) throw new AppError('User not found', 404);

    const updateData = {
        ...(name && { name: name.trim() }),
        ...(email && { email: email.trim().toLowerCase() }),
        ...(role_id !== undefined && { role_id }),
        ...(department_id !== undefined && { department_id }),
        ...(status && { status }),
        ...(profile_picture_url !== undefined && { profile_picture_url: normalizeProfilePictureUrl(profile_picture_url) })
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

    const [[updatedUser]] = await db.query('SELECT id, name, email, profile_picture_url, status, updated_at FROM users WHERE id = ?', [req.params.id]);
    res.json(applyDefaultProfilePicture(updatedUser));
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

app.use((req, res) => { res.status(404).json({ success: false, error: `Route ${req.originalUrl} not found` }); });

const startServer = async () => {
    try {
        await verifyDatabaseConnection();
        await runMigrations(db);
        app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();
