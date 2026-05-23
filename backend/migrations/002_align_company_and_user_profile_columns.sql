SET @has_registration_no := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'companies'
    AND COLUMN_NAME = 'registration_no'
);

SET @has_registration_number := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'companies'
    AND COLUMN_NAME = 'registration_number'
);

SET @sql := IF(
  @has_registration_number = 0 AND @has_registration_no = 1,
  'ALTER TABLE companies CHANGE COLUMN registration_no registration_number VARCHAR(100) DEFAULT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_industry := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'companies'
    AND COLUMN_NAME = 'industry'
);

SET @has_sector := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'companies'
    AND COLUMN_NAME = 'sector'
);

SET @sql := IF(
  @has_sector = 0 AND @has_industry = 1,
  'ALTER TABLE companies CHANGE COLUMN industry sector VARCHAR(150) DEFAULT NULL',
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
      AND TABLE_NAME = 'companies'
      AND COLUMN_NAME = 'size'
  ) = 0,
  'ALTER TABLE companies ADD COLUMN size VARCHAR(50) DEFAULT NULL AFTER sector',
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
      AND TABLE_NAME = 'companies'
      AND COLUMN_NAME = 'currency'
  ) = 0,
  'ALTER TABLE companies ADD COLUMN currency VARCHAR(10) NOT NULL DEFAULT ''RWF'' AFTER size',
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
      AND TABLE_NAME = 'companies'
      AND COLUMN_NAME = 'incorporation_date'
  ) = 0,
  'ALTER TABLE companies ADD COLUMN incorporation_date DATE DEFAULT NULL AFTER currency',
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
      AND TABLE_NAME = 'companies'
      AND COLUMN_NAME = 'fiscal_year_start'
  ) = 0,
  'ALTER TABLE companies ADD COLUMN fiscal_year_start VARCHAR(5) DEFAULT ''01-01'' AFTER incorporation_date',
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
      AND TABLE_NAME = 'companies'
      AND COLUMN_NAME = 'tax_regime'
  ) = 0,
  'ALTER TABLE companies ADD COLUMN tax_regime VARCHAR(100) DEFAULT ''General'' AFTER fiscal_year_start',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

ALTER TABLE companies
  MODIFY COLUMN status ENUM('active','inactive','pending','suspended') NOT NULL DEFAULT 'active';

UPDATE companies
SET
  currency = COALESCE(NULLIF(TRIM(currency), ''), 'RWF'),
  fiscal_year_start = COALESCE(NULLIF(TRIM(fiscal_year_start), ''), '01-01'),
  tax_regime = COALESCE(NULLIF(TRIM(tax_regime), ''), 'General'),
  country = COALESCE(NULLIF(TRIM(country), ''), 'Rwanda');

SET @sql := IF(
  (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'profile_picture_url'
  ) = 0,
  'ALTER TABLE users ADD COLUMN profile_picture_url VARCHAR(500) DEFAULT NULL AFTER email',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE users
SET profile_picture_url = NULLIF(TRIM(profile_picture_url), '');
