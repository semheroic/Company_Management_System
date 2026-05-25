CREATE TABLE IF NOT EXISTS transaction_analytics (
  id INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  company_id INT(10) UNSIGNED NOT NULL,
  transaction_id VARCHAR(100) NOT NULL,
  source_type VARCHAR(50) NOT NULL,
  transaction_date DATE NOT NULL,
  description TEXT DEFAULT NULL,
  party_name VARCHAR(255) DEFAULT NULL,
  amount DECIMAL(20,4) NOT NULL DEFAULT 0.0000,
  income_source VARCHAR(100) DEFAULT NULL,
  tax_category VARCHAR(100) DEFAULT NULL,
  payment_method VARCHAR(100) DEFAULT NULL,
  payment_status VARCHAR(50) DEFAULT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'posted',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_transaction_analytics_company_txn (company_id, transaction_id),
  KEY idx_ta_company_date (company_id, transaction_date),
  KEY idx_ta_company_source (company_id, source_type),
  KEY idx_ta_company_status (company_id, status),
  CONSTRAINT fk_ta_company FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO transaction_analytics (
  company_id,
  transaction_id,
  source_type,
  transaction_date,
  description,
  party_name,
  amount,
  income_source,
  tax_category,
  payment_method,
  payment_status,
  status,
  created_at,
  updated_at
)
SELECT
  je.company_id,
  je.source_id,
  je.entry_type,
  je.entry_date,
  je.description,
  inv.party_name,
  COALESCE((
    SELECT SUM(gl.credit - gl.debit)
    FROM general_ledger gl
    INNER JOIN accounts a ON a.id = gl.account_id
    WHERE gl.company_id = je.company_id
      AND gl.journal_entry_id = je.id
      AND a.company_id = je.company_id
      AND a.category = 'revenue'
  ), 0),
  CASE
    WHEN je.entry_type = 'sale' THEN 'sales'
    ELSE 'other'
  END,
  inv.tax_category,
  inv.payment_method,
  COALESCE(inv.status, 'paid'),
  COALESCE(je.status, 'posted'),
  je.created_at,
  je.updated_at
FROM journal_entries je
LEFT JOIN invoice inv
  ON inv.company_id = je.company_id
 AND inv.transaction_id = je.source_id
 AND inv.type = 'invoice'
WHERE je.source_id IS NOT NULL
  AND je.entry_type IN ('sale', 'income')
ON DUPLICATE KEY UPDATE
  source_type = VALUES(source_type),
  transaction_date = VALUES(transaction_date),
  description = VALUES(description),
  party_name = VALUES(party_name),
  amount = VALUES(amount),
  income_source = VALUES(income_source),
  tax_category = VALUES(tax_category),
  payment_method = VALUES(payment_method),
  payment_status = VALUES(payment_status),
  status = VALUES(status),
  updated_at = VALUES(updated_at);
