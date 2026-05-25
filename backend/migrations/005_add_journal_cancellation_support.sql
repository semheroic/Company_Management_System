SET @sql := IF(
  (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'journal_entries'
      AND COLUMN_NAME = 'source_id'
  ) = 0,
  'ALTER TABLE journal_entries ADD COLUMN source_id VARCHAR(100) DEFAULT NULL AFTER reference_no',
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
      AND TABLE_NAME = 'journal_entries'
      AND COLUMN_NAME = 'status'
  ) = 0,
  'ALTER TABLE journal_entries ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT ''posted'' AFTER source_id',
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
      AND TABLE_NAME = 'journal_entries'
      AND COLUMN_NAME = 'cancelled_at'
  ) = 0,
  'ALTER TABLE journal_entries ADD COLUMN cancelled_at TIMESTAMP NULL DEFAULT NULL AFTER status',
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
      AND TABLE_NAME = 'journal_entries'
      AND COLUMN_NAME = 'cancelled_reason'
  ) = 0,
  'ALTER TABLE journal_entries ADD COLUMN cancelled_reason TEXT DEFAULT NULL AFTER cancelled_at',
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
      AND TABLE_NAME = 'journal_entries'
      AND COLUMN_NAME = 'reversal_journal_entry_id'
  ) = 0,
  'ALTER TABLE journal_entries ADD COLUMN reversal_journal_entry_id INT(10) UNSIGNED DEFAULT NULL AFTER cancelled_reason',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE journal_entries
SET status = 'posted'
WHERE status IS NULL OR TRIM(status) = '';

UPDATE journal_entries je
JOIN invoice i
  ON i.company_id = je.company_id
 AND i.number = je.reference_no
SET je.source_id = i.transaction_id
WHERE je.source_id IS NULL
  AND i.transaction_id IS NOT NULL;

SET @sql := IF(
  (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'journal_entries'
      AND INDEX_NAME = 'idx_je_source_id'
  ) = 0,
  'ALTER TABLE journal_entries ADD KEY idx_je_source_id (source_id)',
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
      AND TABLE_NAME = 'journal_entries'
      AND INDEX_NAME = 'idx_je_status'
  ) = 0,
  'ALTER TABLE journal_entries ADD KEY idx_je_status (status)',
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
      AND TABLE_NAME = 'journal_entries'
      AND INDEX_NAME = 'idx_je_reversal_journal'
  ) = 0,
  'ALTER TABLE journal_entries ADD KEY idx_je_reversal_journal (reversal_journal_entry_id)',
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
      AND TABLE_NAME = 'journal_entries'
      AND CONSTRAINT_NAME = 'fk_je_reversal'
  ) = 0,
  'ALTER TABLE journal_entries ADD CONSTRAINT fk_je_reversal FOREIGN KEY (reversal_journal_entry_id) REFERENCES journal_entries (id) ON DELETE SET NULL ON UPDATE CASCADE',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
