CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(191) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    last_login_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(191) NOT NULL,
    tin VARCHAR(100) NULL,
    registration_number VARCHAR(100) NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'RWF',
    sector VARCHAR(100) NULL,
    size VARCHAR(50) NULL,
    incorporation_date DATE NULL,
    fiscal_year_start VARCHAR(10) NULL,
    tax_regime VARCHAR(100) NULL,
    email VARCHAR(191) NULL,
    phone VARCHAR(100) NULL,
    address VARCHAR(255) NULL,
    status ENUM('active', 'inactive', 'pending') NOT NULL DEFAULT 'active',
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_company_tin (tin),
    CONSTRAINT fk_companies_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS company_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_company_documents_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS company_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    name VARCHAR(191) NOT NULL,
    national_id VARCHAR(100) NOT NULL,
    role VARCHAR(100) NOT NULL,
    nationality VARCHAR(100) NOT NULL,
    shares_held DECIMAL(18,2) NOT NULL DEFAULT 0,
    join_date DATE NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Active',
    is_beneficial_owner TINYINT(1) NOT NULL DEFAULT 0,
    document_path VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_member_company_identity (company_id, national_id),
    CONSTRAINT fk_company_members_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS company_capital_structure (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL UNIQUE,
    authorized_shares DECIMAL(18,2) NOT NULL DEFAULT 0,
    share_price DECIMAL(18,2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'RWF',
    capital_type ENUM('ordinary', 'preference', 'mixed') NOT NULL DEFAULT 'ordinary',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_capital_structure_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS capital_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    shareholder_id INT NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    date_contributed DATE NOT NULL,
    method VARCHAR(50) NOT NULL,
    description TEXT NULL,
    entry_type ENUM('contribution', 'withdrawal', 'adjustment') NOT NULL DEFAULT 'contribution',
    status ENUM('pending', 'confirmed', 'cancelled') NOT NULL DEFAULT 'pending',
    file_url VARCHAR(500) NULL,
    created_by VARCHAR(191) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_capital_entries_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_capital_entries_member FOREIGN KEY (shareholder_id) REFERENCES company_members(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS beneficial_owners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    full_name VARCHAR(191) NOT NULL,
    nationality VARCHAR(100) NOT NULL,
    id_number VARCHAR(100) NOT NULL,
    date_of_birth DATE NULL,
    relationship_to_company ENUM('direct_owner', 'indirect_owner', 'ultimate_controller', 'nominee_beneficiary', 'trustee', 'other') NOT NULL DEFAULT 'direct_owner',
    ownership_percentage DECIMAL(7,2) NOT NULL DEFAULT 0,
    control_percentage DECIMAL(7,2) NOT NULL DEFAULT 0,
    has_significant_control TINYINT(1) NOT NULL DEFAULT 0,
    control_nature JSON NULL,
    physical_address TEXT NULL,
    verification_status ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_beneficial_owners_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS beneficial_owner_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    beneficial_owner_id INT NOT NULL,
    document_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bo_documents_owner FOREIGN KEY (beneficial_owner_id) REFERENCES beneficial_owners(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ownership_mappings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    member_id INT NOT NULL,
    beneficial_owner_id INT NOT NULL,
    relationship_type VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ownership_mappings_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_ownership_mappings_member FOREIGN KEY (member_id) REFERENCES company_members(id) ON DELETE CASCADE,
    CONSTRAINT fk_ownership_mappings_bo FOREIGN KEY (beneficial_owner_id) REFERENCES company_members(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS share_transfer (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    from_member_id INT NOT NULL,
    to_member_id INT NOT NULL,
    shares_amount DECIMAL(18,2) NOT NULL,
    transaction_date DATE NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_share_transfer_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_share_transfer_from_member FOREIGN KEY (from_member_id) REFERENCES company_members(id) ON DELETE CASCADE,
    CONSTRAINT fk_share_transfer_to_member FOREIGN KEY (to_member_id) REFERENCES company_members(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS meeting_minutes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    title VARCHAR(191) NOT NULL,
    type VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    time VARCHAR(20) NOT NULL,
    location VARCHAR(191) NOT NULL,
    chairperson VARCHAR(191) NOT NULL,
    secretary VARCHAR(191) NOT NULL,
    attendees JSON NOT NULL,
    agenda JSON NOT NULL,
    discussions TEXT NULL,
    decisions JSON NOT NULL,
    action_items JSON NOT NULL,
    next_meeting_date DATE NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_meeting_minutes_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS business_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    title VARCHAR(191) NOT NULL,
    year INT NOT NULL,
    description TEXT NULL,
    strategic_goals TEXT NULL,
    mission_statement TEXT NULL,
    vision_statement TEXT NULL,
    swot_analysis TEXT NULL,
    financial_projections TEXT NULL,
    market_analysis TEXT NULL,
    competitive_analysis TEXT NULL,
    uploaded_by VARCHAR(191) NULL,
    status ENUM('draft', 'active', 'archived') NOT NULL DEFAULT 'draft',
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_business_plans_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS share_certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    certificate_number VARCHAR(100) NOT NULL,
    shareholder_name VARCHAR(191) NOT NULL,
    shares_allocated DECIMAL(18,2) NOT NULL DEFAULT 0,
    issue_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_share_certificates_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS company_charges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    lender_name VARCHAR(191) NOT NULL,
    charge_type VARCHAR(100) NOT NULL,
    amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    registration_date DATE NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_company_charges_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dividend_declarations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    profit_amount DECIMAL(18,2) NOT NULL,
    dividend_percentage DECIMAL(7,2) NOT NULL,
    declaration_date DATE NOT NULL,
    approved_by VARCHAR(191) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_dividend_declarations_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dividend_distributions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    declaration_id INT NOT NULL,
    shareholder_name VARCHAR(191) NOT NULL,
    shares_held_at_declaration DECIMAL(18,2) NOT NULL DEFAULT 0,
    amount_allocated DECIMAL(18,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dividend_distributions_declaration FOREIGN KEY (declaration_id) REFERENCES dividend_declarations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(191) NOT NULL,
    category VARCHAR(100) NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_account_code_per_company (company_id, code),
    CONSTRAINT fk_accounts_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS journal_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    entry_type VARCHAR(100) NULL,
    reference_no VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_journal_entries_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS general_ledger (
    id INT AUTO_INCREMENT PRIMARY KEY,
    journal_entry_id INT NOT NULL,
    account_id INT NOT NULL,
    debit DECIMAL(18,2) NOT NULL DEFAULT 0,
    credit DECIMAL(18,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_general_ledger_journal FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
    CONSTRAINT fk_general_ledger_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS supporting_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    journal_entry_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_supporting_documents_journal FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE
);
