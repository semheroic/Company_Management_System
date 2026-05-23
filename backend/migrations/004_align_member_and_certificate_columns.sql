SET @has_member_type := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'company_members'
    AND COLUMN_NAME = 'member_type'
);

SET @has_member_role := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'company_members'
    AND COLUMN_NAME = 'role'
);

SET @sql := IF(
  @has_member_role = 0 AND @has_member_type = 1,
  'ALTER TABLE company_members CHANGE COLUMN member_type role VARCHAR(100) DEFAULT NULL',
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
      AND TABLE_NAME = 'company_members'
      AND COLUMN_NAME = 'role'
  ) = 0,
  'ALTER TABLE company_members ADD COLUMN role VARCHAR(100) DEFAULT NULL AFTER name',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @has_certificate_number := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'share_certificates'
    AND COLUMN_NAME = 'certificate_number'
);

SET @has_certificate_no := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'share_certificates'
    AND COLUMN_NAME = 'certificate_no'
);

SET @sql := IF(
  @has_certificate_no = 0 AND @has_certificate_number = 1,
  'ALTER TABLE share_certificates CHANGE COLUMN certificate_number certificate_no VARCHAR(100) DEFAULT NULL',
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
      AND TABLE_NAME = 'share_certificates'
      AND COLUMN_NAME = 'certificate_no'
  ) = 0,
  'ALTER TABLE share_certificates ADD COLUMN certificate_no VARCHAR(100) DEFAULT NULL AFTER member_id',
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
      AND TABLE_NAME = 'share_certificates'
      AND COLUMN_NAME = 'holder_name'
  ) = 0,
  'ALTER TABLE share_certificates ADD COLUMN holder_name VARCHAR(255) DEFAULT NULL AFTER certificate_no',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE share_certificates sc
LEFT JOIN company_members cm
  ON cm.id = sc.member_id
SET
  sc.holder_name = COALESCE(NULLIF(TRIM(sc.holder_name), ''), cm.name)
WHERE sc.holder_name IS NULL OR TRIM(sc.holder_name) = '';
