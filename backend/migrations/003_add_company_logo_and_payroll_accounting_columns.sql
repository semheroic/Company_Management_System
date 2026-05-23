SET @sql := IF(
  (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'companies'
      AND COLUMN_NAME = 'logo_url'
  ) = 0,
  'ALTER TABLE companies ADD COLUMN logo_url VARCHAR(500) DEFAULT NULL AFTER name',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'payroll_records'
      AND COLUMN_NAME = 'accounting_journal_id'
  ) = 0,
  'ALTER TABLE payroll_records ADD COLUMN accounting_journal_id INT(10) UNSIGNED DEFAULT NULL AFTER paid_at',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'payroll_records'
      AND COLUMN_NAME = 'accounting_posted_at'
  ) = 0,
  'ALTER TABLE payroll_records ADD COLUMN accounting_posted_at TIMESTAMP NULL DEFAULT NULL AFTER accounting_journal_id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'payroll_records'
      AND INDEX_NAME = 'idx_pr_accounting_journal'
  ) = 0,
  'ALTER TABLE payroll_records ADD KEY idx_pr_accounting_journal (accounting_journal_id)',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := IF(
  (
    SELECT COUNT(*)
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'payroll_records'
      AND CONSTRAINT_NAME = 'fk_pr_accounting_journal'
  ) = 0,
  'ALTER TABLE payroll_records ADD CONSTRAINT fk_pr_accounting_journal FOREIGN KEY (accounting_journal_id) REFERENCES journal_entries (id) ON DELETE SET NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE payroll_records pr
LEFT JOIN journal_entries je
  ON je.company_id = pr.company_id
 AND je.reference_no = CONCAT('PAYROLL-', pr.payroll_month)
SET
  pr.accounting_journal_id = COALESCE(pr.accounting_journal_id, je.id),
  pr.accounting_posted_at = COALESCE(pr.accounting_posted_at, je.created_at)
WHERE je.id IS NOT NULL;
