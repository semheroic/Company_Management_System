CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT DEFAULT NULL,
    department_id INT DEFAULT NULL,
    status ENUM('Active', 'Inactive', 'Suspended') NOT NULL DEFAULT 'Active',
    last_login DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_role (role_id),
    INDEX idx_users_department (department_id),
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL,
    CONSTRAINT fk_users_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS user_permissions (
    user_id INT NOT NULL,
    permission_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, permission_id),
    CONSTRAINT fk_user_permissions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) DEFAULT NULL,
    phone VARCHAR(50) DEFAULT NULL,
    national_id VARCHAR(50) NOT NULL,
    position VARCHAR(255) NOT NULL,
    department VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    gross_salary DECIMAL(15, 2) NOT NULL DEFAULT 0,
    rssb_number VARCHAR(100) DEFAULT NULL,
    status ENUM('active', 'inactive', 'terminated') NOT NULL DEFAULT 'active',
    contract_file_name VARCHAR(255) DEFAULT NULL,
    contract_file_path VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_employee_company_national_id (company_id, national_id),
    INDEX idx_employees_company (company_id),
    INDEX idx_employees_status (status),
    CONSTRAINT fk_employees_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payroll_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    employee_id INT NOT NULL,
    payroll_month CHAR(7) NOT NULL,
    pay_date DATE NOT NULL,
    gross_salary DECIMAL(15, 2) NOT NULL DEFAULT 0,
    paye_tax DECIMAL(15, 2) NOT NULL DEFAULT 0,
    rssb_employee DECIMAL(15, 2) NOT NULL DEFAULT 0,
    rssb_employer DECIMAL(15, 2) NOT NULL DEFAULT 0,
    net_salary DECIMAL(15, 2) NOT NULL DEFAULT 0,
    status ENUM('paid', 'unpaid') NOT NULL DEFAULT 'unpaid',
    paid_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_payroll_company_employee_month (company_id, employee_id, payroll_month),
    INDEX idx_payroll_company_month (company_id, payroll_month),
    INDEX idx_payroll_status (status),
    CONSTRAINT fk_payroll_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_payroll_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS internal_audit_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    audit_type VARCHAR(100) NOT NULL,
    auditor VARCHAR(255) NOT NULL,
    audited_period VARCHAR(100) NOT NULL,
    report_date DATE DEFAULT NULL,
    status ENUM('Scheduled', 'In Progress', 'Completed', 'Under Review') NOT NULL DEFAULT 'Scheduled',
    findings_count INT NOT NULL DEFAULT 0,
    description TEXT DEFAULT NULL,
    recommendations TEXT DEFAULT NULL,
    attachment_file_name VARCHAR(255) DEFAULT NULL,
    attachment_file_path VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_internal_audit_company (company_id),
    INDEX idx_internal_audit_status (status),
    CONSTRAINT fk_internal_audit_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS complaint_risk_issues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    reported_date DATE NOT NULL,
    assigned_to VARCHAR(255) DEFAULT NULL,
    priority ENUM('Low', 'Medium', 'High', 'Critical') NOT NULL DEFAULT 'Medium',
    status ENUM('Open', 'In Progress', 'Under Review', 'Resolved', 'Closed') NOT NULL DEFAULT 'Open',
    deadline DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_complaint_risk_company (company_id),
    INDEX idx_complaint_risk_status (status),
    CONSTRAINT fk_complaint_risk_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS compliance_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    type ENUM('tax', 'hr', 'compliance', 'financial', 'license', 'custom') NOT NULL DEFAULT 'custom',
    severity ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
    status ENUM('active', 'acknowledged', 'resolved', 'snoozed') NOT NULL DEFAULT 'active',
    alert_date DATE NOT NULL,
    due_date DATE NOT NULL,
    for_roles_json TEXT DEFAULT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_by VARCHAR(255) DEFAULT NULL,
    source ENUM('auto', 'manual') NOT NULL DEFAULT 'manual',
    action_required VARCHAR(255) DEFAULT NULL,
    snoozed_until DATE DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_compliance_alerts_company (company_id),
    INDEX idx_compliance_alerts_status (status),
    CONSTRAINT fk_compliance_alerts_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS compliance_deadlines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    task VARCHAR(255) NOT NULL,
    due_date DATE NOT NULL,
    priority ENUM('high', 'medium', 'low') NOT NULL DEFAULT 'medium',
    department VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    status ENUM('pending', 'in-progress', 'completed', 'overdue') NOT NULL DEFAULT 'pending',
    reminder_days INT NOT NULL DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_compliance_deadlines_company (company_id),
    INDEX idx_compliance_deadlines_due_date (due_date),
    CONSTRAINT fk_compliance_deadlines_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS document_vault (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(120) NOT NULL,
    description TEXT DEFAULT NULL,
    date_issued DATE DEFAULT NULL,
    access_role VARCHAR(100) NOT NULL DEFAULT 'all',
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    uploaded_by VARCHAR(255) DEFAULT NULL,
    secured TINYINT(1) NOT NULL DEFAULT 0,
    file_type VARCHAR(120) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_document_vault_company (company_id),
    INDEX idx_document_vault_category (category),
    CONSTRAINT fk_document_vault_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS company_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    general_json LONGTEXT DEFAULT NULL,
    notifications_json LONGTEXT DEFAULT NULL,
    security_json LONGTEXT DEFAULT NULL,
    integrations_json LONGTEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_company_settings_company (company_id),
    CONSTRAINT fk_company_settings_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

INSERT IGNORE INTO roles (name) VALUES
    ('Administrator'),
    ('HR Manager'),
    ('Finance Manager'),
    ('Compliance Officer'),
    ('Auditor');

INSERT IGNORE INTO departments (name) VALUES
    ('Administration'),
    ('Human Resources'),
    ('Finance'),
    ('Compliance'),
    ('Operations'),
    ('Information Technology');

INSERT IGNORE INTO permissions (name) VALUES
    ('manage_users'),
    ('manage_payroll'),
    ('manage_compliance'),
    ('manage_documents'),
    ('view_reports'),
    ('manage_audits'),
    ('manage_settings');
