-- Railway bootstrap schema for Company Management System
-- Import this file into a fresh MySQL database before starting the backend on Railway.
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `accounts` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` int(10) UNSIGNED NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` enum('asset','liability','equity','revenue','expense','other') NOT NULL DEFAULT 'other',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_accounts_company_code` (`company_id`,`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `beneficial_owners` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` int(10) UNSIGNED NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `nationality` varchar(100) DEFAULT NULL,
  `id_number` varchar(100) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `relationship_to_company` varchar(150) DEFAULT 'direct_owner',
  `ownership_percentage` decimal(10,4) NOT NULL DEFAULT 0.0000,
  `control_percentage` decimal(10,4) NOT NULL DEFAULT 0.0000,
  `has_significant_control` tinyint(1) NOT NULL DEFAULT 0,
  `physical_address` text DEFAULT NULL,
  `verification_status` enum('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  `control_nature` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`control_nature`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_bo_company` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `beneficial_owner_documents` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `beneficial_owner_id` int(10) UNSIGNED NOT NULL,
  `document_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_bod_bo` (`beneficial_owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `business_plans` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` int(10) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `year` year(4) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `strategic_goals` text DEFAULT NULL,
  `mission_statement` text DEFAULT NULL,
  `vision_statement` text DEFAULT NULL,
  `swot_analysis` text DEFAULT NULL,
  `financial_projections` text DEFAULT NULL,
  `market_analysis` text DEFAULT NULL,
  `competitive_analysis` text DEFAULT NULL,
  `uploaded_by` varchar(255) NOT NULL DEFAULT 'System',
  `status` enum('draft','active','archived') NOT NULL DEFAULT 'draft',
  `version` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_bp_company` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `capital_entries` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` int(10) UNSIGNED NOT NULL,
  `shareholder_id` int(10) UNSIGNED NOT NULL,
  `amount` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `shares_allocated` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `date_contributed` date DEFAULT NULL,
  `method` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `entry_type` enum('contribution','withdrawal','adjustment') NOT NULL DEFAULT 'contribution',
  `status` enum('pending','confirmed','rejected') NOT NULL DEFAULT 'pending',
  `file_url` varchar(500) DEFAULT NULL,
  `created_by` varchar(150) NOT NULL DEFAULT 'System',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_ce_company` (`company_id`),
  KEY `fk_ce_shareholder` (`shareholder_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `client_supplier_registers` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` enum('client','supplier') NOT NULL,
  `category` varchar(100) NOT NULL,
  `tax_id` varchar(100) NOT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `phone` varchar(50) NOT NULL,
  `email` varchar(255) NOT NULL,
  `agreement_file_name` varchar(255) DEFAULT NULL,
  `agreement_file_path` varchar(500) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_csr_company` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `companies` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `registration_number` varchar(100) DEFAULT NULL,
  `tin` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `sector` varchar(150) DEFAULT NULL,
  `size` varchar(50) DEFAULT NULL,
  `currency` varchar(10) NOT NULL DEFAULT 'RWF',
  `incorporation_date` date DEFAULT NULL,
  `fiscal_year_start` varchar(5) DEFAULT '01-01',
  `tax_regime` varchar(100) DEFAULT 'General',
  `country` varchar(100) DEFAULT 'Rwanda',
  `status` enum('active','inactive','pending','suspended') NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `company_capital_structure` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` int(10) UNSIGNED NOT NULL,
  `authorized_shares` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `share_price` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `currency` varchar(10) NOT NULL DEFAULT 'RWF',
  `capital_type` varchar(100) NOT NULL DEFAULT 'ordinary',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `company_id` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `company_charges` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` int(10) UNSIGNED NOT NULL,
  `charge_type` varchar(100) DEFAULT NULL,
  `creditor` varchar(255) DEFAULT NULL,
  `amount` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `currency` varchar(10) NOT NULL DEFAULT 'RWF',
  `registration_date` date DEFAULT NULL,
  `satisfaction_date` date DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'active',
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_cc_company` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `company_documents` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_cd_company` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `company_members` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `role` varchar(100) DEFAULT NULL,
  `nationality` varchar(100) DEFAULT NULL,
  `national_id` varchar(100) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `shares_held` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `is_beneficial_owner` tinyint(1) NOT NULL DEFAULT 0,
  `join_date` date DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Active',
  `document_path` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_cm_company` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `company_settings` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` int(10) UNSIGNED NOT NULL,
  `general_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`general_json`)),
  `notifications_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`notifications_json`)),
  `security_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`security_json`)),
  `integrations_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`integrations_json`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `company_id` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `complaint_risk_issues` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` int(10) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `reported_date` date NOT NULL,
  `assigned_to` varchar(255) DEFAULT NULL,
  `priority` enum('Low','Medium','High','Critical') NOT NULL DEFAULT 'Medium',
  `status` enum('Open','In Progress','Resolved','Closed') NOT NULL DEFAULT 'Open',
  `deadline` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_cri_company` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `compliance_alerts` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` int(10) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `type` varchar(100) NOT NULL DEFAULT 'custom',
  `severity` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  `status` enum('active','acknowledged','resolved','snoozed') NOT NULL DEFAULT 'active',
  `alert_date` date NOT NULL,
  `due_date` date NOT NULL,
  `for_roles_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`for_roles_json`)),
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_by` varchar(255) DEFAULT NULL,
  `source` varchar(100) NOT NULL DEFAULT 'manual',
  `action_required` text DEFAULT NULL,
  `snoozed_until` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_ca_company` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `compliance_deadlines` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` int(10) UNSIGNED NOT NULL,
  `task` varchar(255) NOT NULL,
  `due_date` date NOT NULL,
  `priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
  `department` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('pending','completed','overdue') NOT NULL DEFAULT 'pending',
  `reminder_days` int(11) NOT NULL DEFAULT 3,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_cld_company` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `contract` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` int(10) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `type` varchar(100) NOT NULL,
  `parties` varchar(500) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Active',
  `value` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `file_name` varchar(255) DEFAULT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_con_company` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `departments` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `dividend_declarations` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` int(10) UNSIGNED NOT NULL,
  `profit_amount` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `dividend_percentage` decimal(10,4) NOT NULL DEFAULT 0.0000,
  `declaration_date` date DEFAULT NULL,
  `approved_by` varchar(255) DEFAULT NULL,
  `status` enum('draft','approved','paid','cancelled') NOT NULL DEFAULT 'draft',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_dd_company` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `dividend_distributions` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `declaration_id` int(10) UNSIGNED NOT NULL,
  `shareholder_name` varchar(255) NOT NULL,
  `shares_held_at_declaration` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `amount_allocated` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_dist_declaration` (`declaration_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `document_vault` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` int(10) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `date_issued` date DEFAULT NULL,
  `access_role` varchar(100) NOT NULL DEFAULT 'all',
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` bigint(20) UNSIGNED NOT NULL DEFAULT 0,
  `uploaded_by` varchar(255) DEFAULT NULL,
  `secured` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_dv_company` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `employees` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` int(10) UNSIGNED NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `national_id` varchar(100) NOT NULL,
  `position` varchar(150) NOT NULL,
  `department` varchar(150) NOT NULL,
  `start_date` date NOT NULL,
  `gross_salary` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `rssb_number` varchar(100) DEFAULT NULL,
  `status` enum('active','inactive','terminated') NOT NULL DEFAULT 'active',
  `contract_file_name` varchar(255) DEFAULT NULL,
  `contract_file_path` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_emp_company` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `fixed_assets` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL,
  `acquisition_date` date NOT NULL,
  `acquisition_cost` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `depreciation_method` varchar(50) NOT NULL DEFAULT 'straight_line',
  `useful_life_years` decimal(10,2) NOT NULL DEFAULT 0.00,
  `residual_value` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `location` varchar(255) DEFAULT NULL,
  `supplier` varchar(255) DEFAULT NULL,
  `status` enum('active','retired','disposed') NOT NULL DEFAULT 'active',
  `retirement_date` date DEFAULT NULL,
  `disposal_amount` decimal(20,4) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_fa_company` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `general_ledger` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` int(10) UNSIGNED NOT NULL,
  `journal_entry_id` int(10) UNSIGNED NOT NULL,
  `account_id` int(10) UNSIGNED NOT NULL,
  `debit` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `credit` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_gl_company` (`company_id`),
  KEY `fk_gl_je` (`journal_entry_id`),
  KEY `fk_gl_account` (`account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `internal_audit_reports` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` int(10) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `audit_type` varchar(100) NOT NULL,
  `auditor` varchar(255) NOT NULL,
  `audited_period` varchar(100) NOT NULL,
  `report_date` date DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Scheduled',
  `findings_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `description` text DEFAULT NULL,
  `recommendations` text DEFAULT NULL,
  `attachment_file_name` varchar(255) DEFAULT NULL,
  `attachment_file_path` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_iar_company` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `invoice` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` int(10) UNSIGNED NOT NULL,
  `transaction_id` varchar(100) DEFAULT NULL,
  `type` enum('invoice','receipt') NOT NULL,
  `number` varchar(100) DEFAULT NULL,
  `party_name` varchar(255) NOT NULL,
  `tin` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `amount` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `vat` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `total` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `attachment_url` varchar(500) DEFAULT NULL,
  `date` date NOT NULL,
  `due_date` date DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'draft',
  `payment_method` varchar(100) DEFAULT NULL,
  `phone_number` varchar(50) DEFAULT NULL,
  `momo_reference` varchar(100) DEFAULT NULL,
  `tax_category` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_inv_company` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `journal_entries` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` int(10) UNSIGNED NOT NULL,
  `entry_date` date NOT NULL,
  `description` text NOT NULL,
  `entry_type` varchar(50) NOT NULL DEFAULT 'manual',
  `reference_no` varchar(100) DEFAULT NULL,
  `source_id` varchar(100) DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'posted',
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `cancelled_reason` text DEFAULT NULL,
  `reversal_journal_entry_id` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_je_company` (`company_id`),
  KEY `idx_je_source_id` (`source_id`),
  KEY `idx_je_status` (`status`),
  KEY `idx_je_reversal_journal` (`reversal_journal_entry_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `meeting_minutes` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` int(10) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `type` varchar(100) NOT NULL,
  `date` date DEFAULT NULL,
  `time` time DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `chairperson` varchar(255) DEFAULT NULL,
  `secretary` varchar(255) DEFAULT NULL,
  `attendees` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`attendees`)),
  `agenda` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`agenda`)),
  `discussions` text DEFAULT NULL,
  `decisions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`decisions`)),
  `action_items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`action_items`)),
  `status` varchar(50) NOT NULL DEFAULT 'Scheduled',
  `next_meeting_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_mm_company` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` varchar(36) NOT NULL,
  `company_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('alert','warning','info','reminder') NOT NULL DEFAULT 'info',
  `priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `due_date` datetime DEFAULT NULL,
  `action_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_company_id` (`company_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_is_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `ownership_mappings` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` int(10) UNSIGNED NOT NULL,
  `member_id` int(10) UNSIGNED NOT NULL,
  `beneficial_owner_id` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_om_company` (`company_id`),
  KEY `fk_om_member` (`member_id`),
  KEY `fk_om_bo` (`beneficial_owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `payroll_records` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` int(10) UNSIGNED NOT NULL,
  `employee_id` int(10) UNSIGNED NOT NULL,
  `payroll_month` varchar(7) NOT NULL,
  `pay_date` date DEFAULT NULL,
  `gross_salary` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `paye_tax` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `rssb_employee` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `rssb_employer` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `net_salary` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `status` enum('unpaid','paid') NOT NULL DEFAULT 'unpaid',
  `paid_at` timestamp NULL DEFAULT NULL,
  `accounting_journal_id` int(10) UNSIGNED DEFAULT NULL,
  `accounting_posted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_payroll_emp_month` (`company_id`,`employee_id`,`payroll_month`),
  KEY `fk_pr_employee` (`employee_id`),
  KEY `idx_pr_accounting_journal` (`accounting_journal_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `permissions` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `roles` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `schema_migrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `filename` varchar(255) NOT NULL,
  `executed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `filename` (`filename`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `sessions` (
  `session_id` varchar(128) NOT NULL,
  `expires` int(10) UNSIGNED NOT NULL,
  `data` mediumtext DEFAULT NULL,
  PRIMARY KEY (`session_id`),
  KEY `idx_sessions_expires` (`expires`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `share_certificates` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` int(10) UNSIGNED NOT NULL,
  `member_id` int(10) UNSIGNED DEFAULT NULL,
  `certificate_no` varchar(100) DEFAULT NULL,
  `holder_name` varchar(255) DEFAULT NULL,
  `shares_count` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `issue_date` date DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'active',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_sc_company` (`company_id`),
  KEY `fk_sc_member` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `share_transfer` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` int(10) UNSIGNED NOT NULL,
  `from_member_id` int(10) UNSIGNED NOT NULL,
  `to_member_id` int(10) UNSIGNED NOT NULL,
  `shares_amount` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `transaction_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_st_company` (`company_id`),
  KEY `fk_st_from` (`from_member_id`),
  KEY `fk_st_to` (`to_member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `supporting_documents` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` int(10) UNSIGNED NOT NULL,
  `journal_entry_id` int(10) UNSIGNED NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_sd_company` (`company_id`),
  KEY `fk_sd_je` (`journal_entry_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `tax_returns` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `company_id` int(10) UNSIGNED NOT NULL,
  `tax_type` varchar(50) NOT NULL,
  `period` varchar(20) NOT NULL,
  `submission_date` date DEFAULT NULL,
  `total_declared` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `status` enum('Pending','Filed','Overdue') NOT NULL DEFAULT 'Pending',
  `due_date` date NOT NULL,
  `quarter` varchar(10) DEFAULT NULL,
  `tax_year` varchar(10) DEFAULT NULL,
  `payload_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payload_json`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_tr_company` (`company_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `users` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `email` varchar(255) NOT NULL,
  `profile_picture_url` varchar(500) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role_id` int(10) UNSIGNED DEFAULT NULL,
  `department_id` int(10) UNSIGNED DEFAULT NULL,
  `status` enum('Active','Inactive','Suspended') NOT NULL DEFAULT 'Active',
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_users_role` (`role_id`),
  KEY `fk_users_department` (`department_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `user_permissions` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `permission_id` int(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`user_id`,`permission_id`),
  KEY `fk_up_permission` (`permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

ALTER TABLE `accounts`
  ADD CONSTRAINT `fk_acc_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `beneficial_owners`
  ADD CONSTRAINT `fk_bo_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `beneficial_owner_documents`
  ADD CONSTRAINT `fk_bod_bo` FOREIGN KEY (`beneficial_owner_id`) REFERENCES `beneficial_owners` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `business_plans`
  ADD CONSTRAINT `fk_bp_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `capital_entries`
  ADD CONSTRAINT `fk_ce_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `capital_entries`
  ADD CONSTRAINT `fk_ce_shareholder` FOREIGN KEY (`shareholder_id`) REFERENCES `company_members` (`id`) ON UPDATE CASCADE;

ALTER TABLE `client_supplier_registers`
  ADD CONSTRAINT `fk_csr_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `company_capital_structure`
  ADD CONSTRAINT `fk_ccs_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `company_charges`
  ADD CONSTRAINT `fk_cc_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `company_documents`
  ADD CONSTRAINT `fk_cd_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `company_members`
  ADD CONSTRAINT `fk_cm_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `company_settings`
  ADD CONSTRAINT `fk_cs_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `complaint_risk_issues`
  ADD CONSTRAINT `fk_cri_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `compliance_alerts`
  ADD CONSTRAINT `fk_ca_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `compliance_deadlines`
  ADD CONSTRAINT `fk_cld_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `contract`
  ADD CONSTRAINT `fk_con_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `dividend_declarations`
  ADD CONSTRAINT `fk_dd_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `dividend_distributions`
  ADD CONSTRAINT `fk_dist_declaration` FOREIGN KEY (`declaration_id`) REFERENCES `dividend_declarations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `document_vault`
  ADD CONSTRAINT `fk_dv_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `employees`
  ADD CONSTRAINT `fk_emp_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `fixed_assets`
  ADD CONSTRAINT `fk_fa_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `general_ledger`
  ADD CONSTRAINT `fk_gl_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON UPDATE CASCADE;

ALTER TABLE `general_ledger`
  ADD CONSTRAINT `fk_gl_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `general_ledger`
  ADD CONSTRAINT `fk_gl_je` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `internal_audit_reports`
  ADD CONSTRAINT `fk_iar_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `invoice`
  ADD CONSTRAINT `fk_inv_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `journal_entries`
  ADD CONSTRAINT `fk_je_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `journal_entries`
  ADD CONSTRAINT `fk_je_reversal` FOREIGN KEY (`reversal_journal_entry_id`) REFERENCES `journal_entries` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `meeting_minutes`
  ADD CONSTRAINT `fk_mm_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ownership_mappings`
  ADD CONSTRAINT `fk_om_bo` FOREIGN KEY (`beneficial_owner_id`) REFERENCES `company_members` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ownership_mappings`
  ADD CONSTRAINT `fk_om_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ownership_mappings`
  ADD CONSTRAINT `fk_om_member` FOREIGN KEY (`member_id`) REFERENCES `company_members` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `payroll_records`
  ADD CONSTRAINT `fk_pr_accounting_journal` FOREIGN KEY (`accounting_journal_id`) REFERENCES `journal_entries` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `payroll_records`
  ADD CONSTRAINT `fk_pr_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `payroll_records`
  ADD CONSTRAINT `fk_pr_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON UPDATE CASCADE;

ALTER TABLE `share_certificates`
  ADD CONSTRAINT `fk_sc_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `share_certificates`
  ADD CONSTRAINT `fk_sc_member` FOREIGN KEY (`member_id`) REFERENCES `company_members` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `share_transfer`
  ADD CONSTRAINT `fk_st_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `share_transfer`
  ADD CONSTRAINT `fk_st_from` FOREIGN KEY (`from_member_id`) REFERENCES `company_members` (`id`) ON UPDATE CASCADE;

ALTER TABLE `share_transfer`
  ADD CONSTRAINT `fk_st_to` FOREIGN KEY (`to_member_id`) REFERENCES `company_members` (`id`) ON UPDATE CASCADE;

ALTER TABLE `supporting_documents`
  ADD CONSTRAINT `fk_sd_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `supporting_documents`
  ADD CONSTRAINT `fk_sd_je` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `tax_returns`
  ADD CONSTRAINT `fk_tr_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `user_permissions`
  ADD CONSTRAINT `fk_up_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `user_permissions`
  ADD CONSTRAINT `fk_up_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

INSERT IGNORE INTO `departments` (`id`, `name`) VALUES
(1, 'Executive'),
(2, 'Finance'),
(3, 'Legal & Compliance'),
(4, 'Human Resources'),
(5, 'Operations');

INSERT IGNORE INTO `roles` (`id`, `name`) VALUES
(1, 'Administrator'),
(2, 'Manager'),
(3, 'Accountant'),
(4, 'Compliance Officer'),
(5, 'Viewer');

INSERT IGNORE INTO `permissions` (`id`, `name`) VALUES
(1, 'companies.view'),
(2, 'companies.create'),
(3, 'companies.edit'),
(4, 'companies.delete'),
(5, 'members.view'),
(6, 'members.create'),
(7, 'members.edit'),
(8, 'members.delete'),
(9, 'accounting.view'),
(10, 'accounting.create'),
(11, 'accounting.edit'),
(12, 'payroll.view'),
(13, 'payroll.create'),
(14, 'payroll.approve'),
(15, 'compliance.view'),
(16, 'compliance.create'),
(17, 'compliance.edit'),
(18, 'documents.view'),
(19, 'documents.upload'),
(20, 'documents.delete'),
(22, 'users.create'),
(23, 'users.edit'),
(24, 'users.delete');

SET FOREIGN_KEY_CHECKS = 1;