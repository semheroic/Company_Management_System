const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

const parseSqlStatements = (sql) =>
    sql
        .split(/;\s*(?:\r?\n|$)/)
        .map(statement => statement.trim())
        .filter(Boolean);

async function runMigrations(db) {
    await db.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            filename VARCHAR(255) NOT NULL UNIQUE,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    if (!fs.existsSync(MIGRATIONS_DIR)) return;

    const [executedRows] = await db.query('SELECT filename FROM schema_migrations');
    const executed = new Set(executedRows.map(row => row.filename));
    const files = fs.readdirSync(MIGRATIONS_DIR).filter(file => file.endsWith('.sql')).sort();

    for (const file of files) {
        if (executed.has(file)) continue;

        const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
        const statements = parseSqlStatements(sql);
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();
            for (const statement of statements) {
                await connection.query(statement);
            }
            await connection.query('INSERT INTO schema_migrations (filename) VALUES (?)', [file]);
            await connection.commit();
            console.log(`[migrations] Applied ${file}`);
        } catch (error) {
            await connection.rollback();
            console.error(`[migrations] Failed ${file}:`, error.message);
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = {
    runMigrations
};
