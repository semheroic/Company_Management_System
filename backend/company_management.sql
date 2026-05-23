-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 23, 2026 at 01:00 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `company_management`
--

-- --------------------------------------------------------

--
-- Table structure for table `accounts`
--

CREATE TABLE `accounts` (
  `id` int(10) UNSIGNED NOT NULL,
  `company_id` int(10) UNSIGNED NOT NULL,
  `code` varchar(20) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` enum('asset','liability','equity','revenue','expense','other') NOT NULL DEFAULT 'other',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `accounts`
--

INSERT INTO `accounts` (`id`, `company_id`, `code`, `name`, `category`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 1, '1001', 'Cash at Bank', 'asset', 1, '2026-05-09 10:48:07', '2026-05-09 10:48:07'),
(2, 1, '1002', 'Petty Cash', 'asset', 1, '2026-05-09 10:48:07', '2026-05-09 10:48:07'),
(3, 1, '1003', 'Mobile Money Account', 'asset', 1, '2026-05-09 10:48:07', '2026-05-09 10:48:07'),
(4, 1, '1101', 'Accounts Receivable', 'asset', 1, '2026-05-09 10:48:07', '2026-05-09 10:48:07'),
(5, 1, '1201', 'Inventory', 'asset', 1, '2026-05-09 10:48:08', '2026-05-09 10:48:08'),
(6, 1, '1301', 'Fixed Assets', 'asset', 1, '2026-05-09 10:48:08', '2026-05-09 10:48:08'),
(7, 1, '1302', 'Accumulated Depreciation', 'asset', 1, '2026-05-09 10:48:08', '2026-05-09 10:48:08'),
(8, 1, '2001', 'Accounts Payable', 'liability', 1, '2026-05-09 10:48:08', '2026-05-09 10:48:08'),
(9, 1, '2101', 'VAT Payable', 'liability', 1, '2026-05-09 10:48:08', '2026-05-09 10:48:08'),
(10, 1, '2102', 'PAYE Payable', 'liability', 1, '2026-05-09 10:48:08', '2026-05-09 10:48:08'),
(11, 1, '2103', 'RSSB Payable', 'liability', 1, '2026-05-09 10:48:08', '2026-05-09 10:48:08'),
(12, 1, '2104', 'Dividend Payable', 'liability', 1, '2026-05-09 10:48:08', '2026-05-09 10:48:08'),
(13, 1, '2201', 'Accrued Expenses', 'liability', 1, '2026-05-09 10:48:08', '2026-05-09 10:48:08'),
(14, 1, '3000', 'Share Capital', 'equity', 1, '2026-05-09 10:48:08', '2026-05-09 10:48:08'),
(15, 1, '3001', 'Retained Earnings', 'equity', 1, '2026-05-09 10:48:08', '2026-05-09 10:48:08'),
(16, 1, '3002', 'Owner Drawings', 'equity', 1, '2026-05-09 10:48:08', '2026-05-09 10:48:08'),
(17, 1, '3003', 'Equity Adjustment', 'equity', 1, '2026-05-09 10:48:08', '2026-05-09 10:48:08'),
(18, 1, '4001', 'Sales Revenue', 'revenue', 1, '2026-05-09 10:48:08', '2026-05-09 10:48:08'),
(19, 1, '4002', 'Service Revenue', 'revenue', 1, '2026-05-09 10:48:08', '2026-05-09 10:48:08'),
(20, 1, '4003', 'Other Income', 'revenue', 1, '2026-05-09 10:48:08', '2026-05-09 10:48:08'),
(21, 1, '5001', 'General Expenses', 'expense', 1, '2026-05-09 10:48:08', '2026-05-09 10:48:08'),
(22, 1, '5002', 'Salaries & Wages', 'expense', 1, '2026-05-09 10:48:08', '2026-05-09 10:48:08'),
(23, 1, '5003', 'Rent Expense', 'expense', 1, '2026-05-09 10:48:08', '2026-05-09 10:48:08'),
(24, 1, '5004', 'Utilities Expense', 'expense', 1, '2026-05-09 10:48:08', '2026-05-09 10:48:08'),
(25, 1, '5005', 'Office Supplies', 'expense', 1, '2026-05-09 10:48:08', '2026-05-09 10:48:08'),
(26, 1, '5006', 'Professional Fees', 'expense', 1, '2026-05-09 10:48:08', '2026-05-09 10:48:08'),
(27, 1, '5007', 'Depreciation Expense', 'expense', 1, '2026-05-09 10:48:08', '2026-05-09 10:48:08'),
(28, 1, '5008', 'Other Expenses', 'expense', 1, '2026-05-09 10:48:08', '2026-05-09 10:48:08'),
(29, 6, '1001', 'Cash at Bank', 'asset', 1, '2026-05-20 16:33:11', '2026-05-20 16:33:11'),
(30, 6, '1002', 'Petty Cash', 'asset', 1, '2026-05-20 16:33:11', '2026-05-20 16:33:11'),
(31, 6, '1003', 'Mobile Money Account', 'asset', 1, '2026-05-20 16:33:11', '2026-05-20 16:33:11'),
(32, 6, '1101', 'Accounts Receivable', 'asset', 1, '2026-05-20 16:33:11', '2026-05-20 16:33:11'),
(33, 6, '1201', 'Inventory', 'asset', 1, '2026-05-20 16:33:11', '2026-05-20 16:33:11'),
(34, 6, '1301', 'Fixed Assets', 'asset', 1, '2026-05-20 16:33:11', '2026-05-20 16:33:11'),
(35, 6, '1302', 'Accumulated Depreciation', 'asset', 1, '2026-05-20 16:33:11', '2026-05-20 16:33:11'),
(36, 6, '2001', 'Accounts Payable', 'liability', 1, '2026-05-20 16:33:11', '2026-05-20 16:33:11'),
(37, 6, '2101', 'VAT Payable', 'liability', 1, '2026-05-20 16:33:11', '2026-05-20 16:33:11'),
(38, 6, '2102', 'PAYE Payable', 'liability', 1, '2026-05-20 16:33:11', '2026-05-20 16:33:11'),
(39, 6, '2103', 'RSSB Payable', 'liability', 1, '2026-05-20 16:33:11', '2026-05-20 16:33:11'),
(40, 6, '2104', 'Dividend Payable', 'liability', 1, '2026-05-20 16:33:11', '2026-05-20 16:33:11'),
(41, 6, '2201', 'Accrued Expenses', 'liability', 1, '2026-05-20 16:33:11', '2026-05-20 16:33:11'),
(42, 6, '3000', 'Share Capital', 'equity', 1, '2026-05-20 16:33:11', '2026-05-20 16:33:11'),
(43, 6, '3001', 'Retained Earnings', 'equity', 1, '2026-05-20 16:33:11', '2026-05-20 16:33:11'),
(44, 6, '3002', 'Owner Drawings', 'equity', 1, '2026-05-20 16:33:11', '2026-05-20 16:33:11'),
(45, 6, '3003', 'Equity Adjustment', 'equity', 1, '2026-05-20 16:33:11', '2026-05-20 16:33:11'),
(46, 6, '4001', 'Sales Revenue', 'revenue', 1, '2026-05-20 16:33:11', '2026-05-20 16:33:11'),
(47, 6, '4002', 'Service Revenue', 'revenue', 1, '2026-05-20 16:33:11', '2026-05-20 16:33:11'),
(48, 6, '4003', 'Other Income', 'revenue', 1, '2026-05-20 16:33:11', '2026-05-20 16:33:11'),
(49, 6, '5001', 'General Expenses', 'expense', 1, '2026-05-20 16:33:11', '2026-05-20 16:33:11'),
(50, 6, '5002', 'Salaries & Wages', 'expense', 1, '2026-05-20 16:33:11', '2026-05-20 16:33:11'),
(51, 6, '5003', 'Rent Expense', 'expense', 1, '2026-05-20 16:33:11', '2026-05-20 16:33:11'),
(52, 6, '5004', 'Utilities Expense', 'expense', 1, '2026-05-20 16:33:11', '2026-05-20 16:33:11'),
(53, 6, '5005', 'Office Supplies', 'expense', 1, '2026-05-20 16:33:11', '2026-05-20 16:33:11'),
(54, 6, '5006', 'Professional Fees', 'expense', 1, '2026-05-20 16:33:11', '2026-05-20 16:33:11'),
(55, 6, '5007', 'Depreciation Expense', 'expense', 1, '2026-05-20 16:33:11', '2026-05-20 16:33:11'),
(56, 6, '5008', 'Other Expenses', 'expense', 1, '2026-05-20 16:33:11', '2026-05-20 16:33:11'),
(57, 2, '1001', 'Cash at Bank', 'asset', 1, '2026-05-21 19:19:17', '2026-05-21 19:19:17'),
(58, 2, '1002', 'Petty Cash', 'asset', 1, '2026-05-21 19:19:17', '2026-05-21 19:19:17'),
(59, 2, '1003', 'Mobile Money Account', 'asset', 1, '2026-05-21 19:19:17', '2026-05-21 19:19:17'),
(60, 2, '1101', 'Accounts Receivable', 'asset', 1, '2026-05-21 19:19:17', '2026-05-21 19:19:17'),
(61, 2, '1201', 'Inventory', 'asset', 1, '2026-05-21 19:19:17', '2026-05-21 19:19:17'),
(62, 2, '1301', 'Fixed Assets', 'asset', 1, '2026-05-21 19:19:17', '2026-05-21 19:19:17'),
(63, 2, '1302', 'Accumulated Depreciation', 'asset', 1, '2026-05-21 19:19:17', '2026-05-21 19:19:17'),
(64, 2, '2001', 'Accounts Payable', 'liability', 1, '2026-05-21 19:19:17', '2026-05-21 19:19:17'),
(65, 2, '2101', 'VAT Payable', 'liability', 1, '2026-05-21 19:19:17', '2026-05-21 19:19:17'),
(66, 2, '2102', 'PAYE Payable', 'liability', 1, '2026-05-21 19:19:17', '2026-05-21 19:19:17'),
(67, 2, '2103', 'RSSB Payable', 'liability', 1, '2026-05-21 19:19:17', '2026-05-21 19:19:17'),
(68, 2, '2104', 'Dividend Payable', 'liability', 1, '2026-05-21 19:19:17', '2026-05-21 19:19:17'),
(69, 2, '2201', 'Accrued Expenses', 'liability', 1, '2026-05-21 19:19:17', '2026-05-21 19:19:17'),
(70, 2, '3000', 'Share Capital', 'equity', 1, '2026-05-21 19:19:17', '2026-05-21 19:19:17'),
(71, 2, '3001', 'Retained Earnings', 'equity', 1, '2026-05-21 19:19:17', '2026-05-21 19:19:17'),
(72, 2, '3002', 'Owner Drawings', 'equity', 1, '2026-05-21 19:19:17', '2026-05-21 19:19:17'),
(73, 2, '3003', 'Equity Adjustment', 'equity', 1, '2026-05-21 19:19:17', '2026-05-21 19:19:17'),
(74, 2, '4001', 'Sales Revenue', 'revenue', 1, '2026-05-21 19:19:17', '2026-05-21 19:19:17'),
(75, 2, '4002', 'Service Revenue', 'revenue', 1, '2026-05-21 19:19:17', '2026-05-21 19:19:17'),
(76, 2, '4003', 'Other Income', 'revenue', 1, '2026-05-21 19:19:17', '2026-05-21 19:19:17'),
(77, 2, '5001', 'General Expenses', 'expense', 1, '2026-05-21 19:19:17', '2026-05-21 19:19:17'),
(78, 2, '5002', 'Salaries & Wages', 'expense', 1, '2026-05-21 19:19:17', '2026-05-21 19:19:17'),
(79, 2, '5003', 'Rent Expense', 'expense', 1, '2026-05-21 19:19:17', '2026-05-21 19:19:17'),
(80, 2, '5004', 'Utilities Expense', 'expense', 1, '2026-05-21 19:19:17', '2026-05-21 19:19:17'),
(81, 2, '5005', 'Office Supplies', 'expense', 1, '2026-05-21 19:19:17', '2026-05-21 19:19:17'),
(82, 2, '5006', 'Professional Fees', 'expense', 1, '2026-05-21 19:19:17', '2026-05-21 19:19:17'),
(83, 2, '5007', 'Depreciation Expense', 'expense', 1, '2026-05-21 19:19:17', '2026-05-21 19:19:17'),
(84, 2, '5008', 'Other Expenses', 'expense', 1, '2026-05-21 19:19:17', '2026-05-21 19:19:17');

-- --------------------------------------------------------

--
-- Table structure for table `beneficial_owners`
--

CREATE TABLE `beneficial_owners` (
  `id` int(10) UNSIGNED NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `beneficial_owners`
--

INSERT INTO `beneficial_owners` (`id`, `company_id`, `full_name`, `nationality`, `id_number`, `date_of_birth`, `relationship_to_company`, `ownership_percentage`, `control_percentage`, `has_significant_control`, `physical_address`, `verification_status`, `control_nature`, `created_at`, `updated_at`) VALUES
(1, 1, 'Himbaza Heroic', 'Rwandan', '7675766566', NULL, 'direct_owner', 70.0000, 0.0000, 0, 'kigali', 'pending', '[]', '2026-05-11 15:42:26', '2026-05-11 15:42:26'),
(2, 1, 'Himbaza Heroic', 'Rwandan', '7675766566', NULL, 'indirect_owner', 30.0000, 0.0000, 0, 'kigali', 'pending', '[]', '2026-05-11 15:43:01', '2026-05-11 15:43:01'),
(3, 2, 'Himbaza Heroic', 'Rwandan', '7675766566', NULL, 'direct_owner', 60.0000, 0.0000, 0, 'kigali', 'pending', '[]', '2026-05-21 19:26:58', '2026-05-21 19:26:58');

-- --------------------------------------------------------

--
-- Table structure for table `beneficial_owner_documents`
--

CREATE TABLE `beneficial_owner_documents` (
  `id` int(10) UNSIGNED NOT NULL,
  `beneficial_owner_id` int(10) UNSIGNED NOT NULL,
  `document_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `business_plans`
--

CREATE TABLE `business_plans` (
  `id` int(10) UNSIGNED NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `business_plans`
--

INSERT INTO `business_plans` (`id`, `company_id`, `title`, `year`, `description`, `strategic_goals`, `mission_statement`, `vision_statement`, `swot_analysis`, `financial_projections`, `market_analysis`, `competitive_analysis`, `uploaded_by`, `status`, `version`, `created_at`, `updated_at`) VALUES
(1, 1, 'AI and Cloud Services Expansion', '2026', 'Expansion into artificial intelligence and cloud computing services.', 'Launch AI-powered business solutions and increase cloud infrastructure clients.', 'Provide innovative and scalable technology solutions.', 'Become the leading AI and cloud technology provider in Rwanda.', 'Strengths: Skilled IT staff. Weaknesses: High infrastructure costs. Opportunities: Growing AI adoption. Threats: Fast-changing technologies.', 'Projected annual revenue growth of 30 percent.', 'Increasing demand for cloud and AI services in East Africa.', 'Competition from international cloud providers.', 'System Administrator', 'archived', 1, '2026-05-09 11:31:49', '2026-05-11 15:43:37'),
(2, 1, 'Cybersecurity Enhancement Strategy', '2026', 'Development of advanced cybersecurity services for enterprises.', 'Improve threat detection systems and expand security consulting.', 'Protect businesses through reliable cybersecurity solutions.', 'Become the most trusted cybersecurity company in Rwanda.', 'Strengths: Security expertise. Weaknesses: Limited regional presence. Opportunities: Rising cyber threats. Threats: Global competitors.', 'Expected service growth of 20 percent annually.', 'High demand for digital security solutions.', 'Competition from specialized security firms.', 'System Administrator', 'active', 1, '2026-05-09 11:31:49', '2026-05-11 15:44:03'),
(3, 1, 'Software Product Development Plan', '2026', 'Creation of ERP and business management software products.', 'Develop scalable software for SMEs and large enterprises.', 'Simplify business operations through technology.', 'Lead software innovation in East Africa.', 'Strengths: Experienced developers. Weaknesses: Product maintenance costs. Opportunities: SME digital transformation. Threats: Piracy and software competition.', 'Projected software sales increase of 25 percent.', 'Growing software demand among businesses.', 'Competition from international ERP providers.', 'System Administrator', 'archived', 1, '2026-05-09 11:31:49', '2026-05-11 15:44:03'),
(4, 1, 'Digital Training and Innovation Hub', '2026', 'Establish a technology training and innovation center.', 'Train youth in software development and digital skills.', 'Empower communities through digital education.', 'Become the top technology innovation hub in Rwanda.', 'Strengths: Skilled trainers. Weaknesses: Initial investment costs. Opportunities: Government support for ICT. Threats: Rapid technology changes.', 'Expected training revenue growth of 15 percent.', 'High demand for ICT skills training.', 'Competition from private training institutions.', 'System Administrator', 'archived', 1, '2026-05-09 11:31:49', '2026-05-11 15:44:02'),
(5, 1, 'Regional Technology Expansion Plan', '2026', 'Expansion of Kigali Tech Solutions services into neighboring countries.', 'Open regional offices and increase international partnerships.', 'Deliver quality technology services across Africa.', 'Become a recognized African technology brand.', 'Strengths: Strong local reputation. Weaknesses: Expansion costs. Opportunities: Regional digital transformation. Threats: International competitors.', 'Projected regional growth of 35 percent over three years.', 'Expanding East African technology market.', 'Competition from multinational technology firms.', 'System Administrator', 'archived', 1, '2026-05-09 11:31:49', '2026-05-11 15:44:00');

-- --------------------------------------------------------

--
-- Table structure for table `capital_entries`
--

CREATE TABLE `capital_entries` (
  `id` int(10) UNSIGNED NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `client_supplier_registers`
--

CREATE TABLE `client_supplier_registers` (
  `id` int(10) UNSIGNED NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `companies`
--

CREATE TABLE `companies` (
  `id` int(10) UNSIGNED NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `companies`
--

INSERT INTO `companies` (`id`, `name`, `logo_url`, `registration_number`, `tin`, `email`, `phone`, `address`, `sector`, `size`, `currency`, `incorporation_date`, `fiscal_year_start`, `tax_regime`, `country`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Kigali Tech Solutions Ltd', NULL, 'RC001234', '100123456', 'info@kigalitech.rw', '+250788100001', 'KG 7 Ave, Kigali', 'technology', 'medium', 'RWF', '2020-01-15', '01-01', 'General', 'Rwanda', 'active', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(2, 'Rwanda Agro Exports Ltd', NULL, 'RC002345', '100234567', 'info@rwandaagro.rw', '+250788100002', 'KK 15 Rd, Kigali', 'agriculture', 'large', 'RWF', '2019-06-10', '01-01', 'General', 'Rwanda', 'active', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(3, 'East Africa Logistics Ltd', NULL, 'RC003456', '100345678', 'ops@ealogistics.rw', '+250788100003', 'KN 3 St, Nyarugenge', 'logistics', 'medium', 'RWF', '2021-03-08', '01-01', 'General', 'Rwanda', 'active', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(4, 'Horizon Finance Group Ltd', NULL, 'RC004567', '100456789', 'contact@horizonfin.rw', '+250788100004', 'Boulevard de la Revolution', 'finance', 'medium', 'RWF', '2018-11-20', '01-01', 'General', 'Rwanda', 'active', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(5, 'Ubumwe Construction Ltd', NULL, 'RC005678', '100567890', 'projects@ubumwe.rw', '+250788100005', 'KG 9 Ave, Gasabo', 'construction', 'large', 'RWF', '2017-05-02', '01-01', 'General', 'Rwanda', 'active', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(6, 'Amazon Web Server', NULL, '9898', 'TIN-876543267', 'divin@gmail.com', '+250786637085', 'Kigali', 'technology', 'micro', 'RWF', '2026-05-09', '01-01', 'General', 'Rwanda', 'active', '2026-05-20 16:33:11', '2026-05-20 16:33:11');

-- --------------------------------------------------------

--
-- Table structure for table `company_capital_structure`
--

CREATE TABLE `company_capital_structure` (
  `id` int(10) UNSIGNED NOT NULL,
  `company_id` int(10) UNSIGNED NOT NULL,
  `authorized_shares` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `share_price` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `currency` varchar(10) NOT NULL DEFAULT 'RWF',
  `capital_type` varchar(100) NOT NULL DEFAULT 'ordinary',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `company_capital_structure`
--

INSERT INTO `company_capital_structure` (`id`, `company_id`, `authorized_shares`, `share_price`, `currency`, `capital_type`, `created_at`, `updated_at`) VALUES
(1, 1, 100000.0000, 10.0000, 'RWF', 'ordinary', '2026-05-09 10:45:39', '2026-05-11 16:34:12'),
(2, 2, 60000.0000, 8.0000, 'RWF', 'ordinary', '2026-05-09 10:45:39', '2026-05-11 16:30:59'),
(3, 3, 20000.0000, 2000.0000, 'RWF', 'ordinary', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(4, 4, 100000.0000, 100.0000, 'RWF', 'ordinary', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(5, 5, 25000.0000, 1500.0000, 'RWF', 'ordinary', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(10, 6, 200000.0000, 10.0000, 'RWF', 'ordinary', '2026-05-20 16:36:33', '2026-05-20 16:36:33');

-- --------------------------------------------------------

--
-- Table structure for table `company_charges`
--

CREATE TABLE `company_charges` (
  `id` int(10) UNSIGNED NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `company_documents`
--

CREATE TABLE `company_documents` (
  `id` int(10) UNSIGNED NOT NULL,
  `company_id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `company_documents`
--

INSERT INTO `company_documents` (`id`, `company_id`, `name`, `file_path`, `created_at`) VALUES
(1, 1, 'Receipt-2557-4035.pdf', 'uploads/1778324544428-Receipt-2557-4035.pdf', '2026-05-09 11:02:24');

-- --------------------------------------------------------

--
-- Table structure for table `company_members`
--

CREATE TABLE `company_members` (
  `id` int(10) UNSIGNED NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `company_members`
--

INSERT INTO `company_members` (`id`, `company_id`, `name`, `role`, `nationality`, `national_id`, `email`, `phone`, `address`, `shares_held`, `is_beneficial_owner`, `join_date`, `status`, `document_path`, `created_at`, `updated_at`) VALUES
(5, 2, 'Samuel Bizimana', 'shareholder', 'Rwandan', '1198750056789012', NULL, NULL, NULL, 15000.0000, 1, '2019-06-01', 'Active', NULL, '2026-05-09 10:45:39', '2026-05-09 10:45:39');

-- --------------------------------------------------------

--
-- Table structure for table `company_settings`
--

CREATE TABLE `company_settings` (
  `id` int(10) UNSIGNED NOT NULL,
  `company_id` int(10) UNSIGNED NOT NULL,
  `general_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`general_json`)),
  `notifications_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`notifications_json`)),
  `security_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`security_json`)),
  `integrations_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`integrations_json`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `company_settings`
--

INSERT INTO `company_settings` (`id`, `company_id`, `general_json`, `notifications_json`, `security_json`, `integrations_json`, `created_at`, `updated_at`) VALUES
(1, 1, '{\"companyName\":\"Kigali Tech Solutions Ltd\",\"currency\":\"RWF\",\"timeZone\":\"Africa/Kigali\",\"language\":\"English\"}', '{\"emailNotifications\":true,\"deadlineAlerts\":true,\"reportReady\":true}', '{\"twoFactorAuth\":false,\"sessionTimeout\":\"30\",\"auditLogging\":true}', '{\"emailServiceConfigured\":false,\"backupConfigured\":false}', '2026-05-09 10:45:43', '2026-05-09 10:45:43'),
(2, 2, '{\"companyName\":\"Rwanda Agro Exports Ltd\",\"currency\":\"RWF\",\"timeZone\":\"Africa/Kigali\",\"language\":\"English\"}', '{\"emailNotifications\":true,\"deadlineAlerts\":true,\"reportReady\":false}', '{\"twoFactorAuth\":false,\"sessionTimeout\":\"30\",\"auditLogging\":true}', '{\"emailServiceConfigured\":false,\"backupConfigured\":false}', '2026-05-09 10:45:43', '2026-05-09 10:45:43'),
(3, 3, '{\"companyName\":\"East Africa Logistics Ltd\",\"currency\":\"RWF\",\"timeZone\":\"Africa/Kigali\",\"language\":\"English\"}', '{\"emailNotifications\":true,\"deadlineAlerts\":true,\"reportReady\":true}', '{\"twoFactorAuth\":false,\"sessionTimeout\":\"60\",\"auditLogging\":true}', '{\"emailServiceConfigured\":false,\"backupConfigured\":false}', '2026-05-09 10:45:43', '2026-05-09 10:45:43'),
(4, 4, '{\"companyName\":\"Horizon Finance Group Ltd\",\"currency\":\"RWF\",\"timeZone\":\"Africa/Kigali\",\"language\":\"English\"}', '{\"emailNotifications\":true,\"deadlineAlerts\":true,\"reportReady\":true}', '{\"twoFactorAuth\":true,\"sessionTimeout\":\"15\",\"auditLogging\":true}', '{\"emailServiceConfigured\":true,\"backupConfigured\":true}', '2026-05-09 10:45:43', '2026-05-09 10:45:43'),
(5, 5, '{\"companyName\":\"Ubumwe Construction Ltd\",\"currency\":\"RWF\",\"timeZone\":\"Africa/Kigali\",\"language\":\"English\"}', '{\"emailNotifications\":false,\"deadlineAlerts\":true,\"reportReady\":false}', '{\"twoFactorAuth\":false,\"sessionTimeout\":\"30\",\"auditLogging\":false}', '{\"emailServiceConfigured\":false,\"backupConfigured\":false}', '2026-05-09 10:45:43', '2026-05-09 10:45:43');

-- --------------------------------------------------------

--
-- Table structure for table `complaint_risk_issues`
--

CREATE TABLE `complaint_risk_issues` (
  `id` int(10) UNSIGNED NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `complaint_risk_issues`
--

INSERT INTO `complaint_risk_issues` (`id`, `company_id`, `title`, `category`, `description`, `reported_date`, `assigned_to`, `priority`, `status`, `deadline`, `created_at`, `updated_at`) VALUES
(1, 1, 'Data Mismatch', 'Safety Issue', 'Data mismatch', '2026-05-09', 'IT Manager', 'High', 'Open', '2026-05-09', '2026-05-09 12:42:29', '2026-05-09 12:42:29');

-- --------------------------------------------------------

--
-- Table structure for table `compliance_alerts`
--

CREATE TABLE `compliance_alerts` (
  `id` int(10) UNSIGNED NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `compliance_alerts`
--

INSERT INTO `compliance_alerts` (`id`, `company_id`, `title`, `description`, `type`, `severity`, `status`, `alert_date`, `due_date`, `for_roles_json`, `is_read`, `created_by`, `source`, `action_required`, `snoozed_until`, `created_at`, `updated_at`) VALUES
(1, 1, 'Data issues', 'data issues', 'custom', 'medium', 'resolved', '2026-05-09', '2026-05-09', '[\"admin\",\"accountant\",\"manager\",\"hr\"]', 1, 'Himbaza  sem Heroic', 'manual', 'Data Recovery ', NULL, '2026-05-09 13:32:35', '2026-05-09 18:53:39'),
(2, 6, 'payment', 'payments', 'compliance', 'high', 'active', '2026-05-20', '2026-05-20', '[\"admin\",\"accountant\",\"manager\",\"hr\",\"legal\"]', 0, 'Himbaza  sem Heroic', 'manual', 'payments ', NULL, '2026-05-20 16:35:48', '2026-05-20 16:35:48');

-- --------------------------------------------------------

--
-- Table structure for table `compliance_deadlines`
--

CREATE TABLE `compliance_deadlines` (
  `id` int(10) UNSIGNED NOT NULL,
  `company_id` int(10) UNSIGNED NOT NULL,
  `task` varchar(255) NOT NULL,
  `due_date` date NOT NULL,
  `priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
  `department` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('pending','completed','overdue') NOT NULL DEFAULT 'pending',
  `reminder_days` int(11) NOT NULL DEFAULT 3,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `contract`
--

CREATE TABLE `contract` (
  `id` int(10) UNSIGNED NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `name`, `created_at`, `updated_at`) VALUES
(1, 'Executive', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(2, 'Finance', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(3, 'Legal & Compliance', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(4, 'Human Resources', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(5, 'Operations', '2026-05-09 10:45:39', '2026-05-09 10:45:39');

-- --------------------------------------------------------

--
-- Table structure for table `dividend_declarations`
--

CREATE TABLE `dividend_declarations` (
  `id` int(10) UNSIGNED NOT NULL,
  `company_id` int(10) UNSIGNED NOT NULL,
  `profit_amount` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `dividend_percentage` decimal(10,4) NOT NULL DEFAULT 0.0000,
  `declaration_date` date DEFAULT NULL,
  `approved_by` varchar(255) DEFAULT NULL,
  `status` enum('draft','approved','paid','cancelled') NOT NULL DEFAULT 'draft',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dividend_distributions`
--

CREATE TABLE `dividend_distributions` (
  `id` int(10) UNSIGNED NOT NULL,
  `declaration_id` int(10) UNSIGNED NOT NULL,
  `shareholder_name` varchar(255) NOT NULL,
  `shares_held_at_declaration` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `amount_allocated` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `document_vault`
--

CREATE TABLE `document_vault` (
  `id` int(10) UNSIGNED NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `document_vault`
--

INSERT INTO `document_vault` (`id`, `company_id`, `title`, `category`, `description`, `date_issued`, `access_role`, `file_name`, `file_path`, `file_size`, `uploaded_by`, `secured`, `created_at`, `updated_at`) VALUES
(1, 1, 'Tax', 'tax-filing', 'Tax ', '2026-05-09', 'admin', 'CV_Template.pdf', 'uploads/1778328412252-CV_Template.pdf', 2232, 'Himbaza  sem Heroic', 1, '2026-05-09 12:06:52', '2026-05-09 12:06:52');

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `id` int(10) UNSIGNED NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `employees`
--

INSERT INTO `employees` (`id`, `company_id`, `full_name`, `email`, `phone`, `national_id`, `position`, `department`, `start_date`, `gross_salary`, `rssb_number`, `status`, `contract_file_name`, `contract_file_path`, `created_at`, `updated_at`) VALUES
(1, 1, 'Aimable Nzabonimpa', 'aimable@kigalitech.rw', '+250781000001', '1199500078901234', 'Software Engineer', 'Engineering', '2021-03-01', 850000.0000, 'RSSB001', 'active', NULL, NULL, '2026-05-09 10:45:40', '2026-05-09 10:45:40'),
(2, 1, 'Solange Uwamariya', 'solange@kigalitech.rw', '+250781000002', '1199800089012345', 'Product Manager', 'Product', '2021-06-01', 950000.0000, 'RSSB002', 'active', NULL, NULL, '2026-05-09 10:45:40', '2026-05-09 10:45:40'),
(3, 1, 'Patrick Niyonzima', 'patrick@kigalitech.rw', '+250781000003', '1198700090123456', 'Financial Analyst', 'Finance', '2022-01-15', 780000.0000, 'RSSB003', 'active', NULL, NULL, '2026-05-09 10:45:40', '2026-05-09 10:45:40'),
(4, 1, 'Vestine Mukamana', 'vestine@kigalitech.rw', '+250781000004', '1199900001234567', 'HR Officer', 'HR', '2022-03-01', 700000.0000, 'RSSB004', 'active', NULL, NULL, '2026-05-09 10:45:40', '2026-05-09 10:45:40'),
(5, 1, 'Innocent Tuyishime', 'innocent@kigalitech.rw', '+250781000005', '1198900012345678', 'DevOps Engineer', 'Engineering', '2023-01-10', 900000.0000, 'RSSB005', 'active', NULL, NULL, '2026-05-09 10:45:40', '2026-05-09 10:45:40'),
(6, 2, 'Alphonse Ndayishimiye', 'alphonse@rwandaagro.rw', '+250782000001', '1199100023456789', 'Operations Manager', 'Operations', '2020-04-01', 1000000.0000, 'RSSB101', 'active', NULL, NULL, '2026-05-09 10:45:40', '2026-05-09 10:45:40'),
(7, 2, 'Julienne Nyirabagabo', 'julienne@rwandaagro.rw', '+250782000002', '1199700034567890', 'Export Coordinator', 'Logistics', '2021-01-15', 750000.0000, 'RSSB102', 'active', NULL, NULL, '2026-05-09 10:45:40', '2026-05-09 10:45:40'),
(8, 2, 'Fidel Habimana', 'fidel@rwandaagro.rw', '+250782000003', '1198600045678901', 'Agronomist', 'Production', '2020-07-01', 820000.0000, 'RSSB103', 'active', NULL, NULL, '2026-05-09 10:45:40', '2026-05-09 10:45:40'),
(9, 1, 'Himbaza Heroic', 'himbazasemu23@gmail.com', '0798367330', '797576864563535', 'data protection', 'Marketing', '2026-05-09', 80000.0000, '8778878', 'active', 'HIMBAZA_SEM_HEROIC_Professional_Software_Developer_CV.pdf', 'uploads/1778324603902-HIMBAZA_SEM_HEROIC_Professional_Software_Developer_CV.pdf', '2026-05-09 11:03:23', '2026-05-09 11:03:23'),
(10, 6, 'Himbaza  sem Heroic', 'himbazasemu23@gmail.com', '0787393136', '75548574897897', 'Data manager', 'IT', '2026-05-20', 600000.0000, '99898', 'active', 'policies_report.pdf', 'uploads/1779295038581-policies_report.pdf', '2026-05-20 16:37:18', '2026-05-20 16:37:18');

-- --------------------------------------------------------

--
-- Table structure for table `fixed_assets`
--

CREATE TABLE `fixed_assets` (
  `id` int(10) UNSIGNED NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `general_ledger`
--

CREATE TABLE `general_ledger` (
  `id` int(10) UNSIGNED NOT NULL,
  `company_id` int(10) UNSIGNED NOT NULL,
  `journal_entry_id` int(10) UNSIGNED NOT NULL,
  `account_id` int(10) UNSIGNED NOT NULL,
  `debit` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `credit` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `general_ledger`
--

INSERT INTO `general_ledger` (`id`, `company_id`, `journal_entry_id`, `account_id`, `debit`, `credit`, `created_at`) VALUES
(1, 1, 1, 21, 20000000.0000, 0.0000, '2026-05-09 10:48:49'),
(2, 1, 1, 1, 0.0000, 20000000.0000, '2026-05-09 10:48:49'),
(7, 1, 4, 22, 4579500.0000, 0.0000, '2026-05-09 13:15:57'),
(8, 1, 4, 10, 0.0000, 612000.0000, '2026-05-09 13:15:57'),
(9, 1, 4, 11, 0.0000, 639000.0000, '2026-05-09 13:15:57'),
(10, 1, 4, 13, 0.0000, 3328500.0000, '2026-05-09 13:15:57'),
(11, 1, 2, 13, 663250.0000, 0.0000, '2026-05-09 13:15:57'),
(12, 1, 2, 1, 0.0000, 663250.0000, '2026-05-09 13:15:57'),
(13, 1, 3, 13, 66500.0000, 0.0000, '2026-05-09 13:15:57'),
(14, 1, 3, 1, 0.0000, 66500.0000, '2026-05-09 13:15:57'),
(15, 1, 5, 1, 100000.0000, 0.0000, '2026-05-09 13:25:46'),
(16, 1, 5, 18, 0.0000, 100000.0000, '2026-05-09 13:25:46'),
(17, 2, 6, 77, 20000000.0000, 0.0000, '2026-05-21 19:20:19'),
(18, 2, 6, 57, 0.0000, 20000000.0000, '2026-05-21 19:20:19'),
(19, 2, 7, 57, 300000000.0000, 0.0000, '2026-05-21 19:22:36'),
(20, 2, 7, 74, 0.0000, 300000000.0000, '2026-05-21 19:22:36');

-- --------------------------------------------------------

--
-- Table structure for table `internal_audit_reports`
--

CREATE TABLE `internal_audit_reports` (
  `id` int(10) UNSIGNED NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invoice`
--

CREATE TABLE `invoice` (
  `id` int(10) UNSIGNED NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `invoice`
--

INSERT INTO `invoice` (`id`, `company_id`, `transaction_id`, `type`, `number`, `party_name`, `tin`, `description`, `amount`, `vat`, `total`, `attachment_url`, `date`, `due_date`, `status`, `payment_method`, `phone_number`, `momo_reference`, `tax_category`, `created_at`, `updated_at`) VALUES
(1, 1, 'txn-1778323729054-jpm8lcp8g', 'receipt', '0798367330', 'Crops LTD', '766756', 'Crops purchase ', 20000000.0000, 0.0000, 20000000.0000, NULL, '2026-05-09', NULL, 'paid', 'bank', NULL, NULL, 'crops_purchase', '2026-05-09 10:48:49', '2026-05-09 10:48:49'),
(2, 1, 'txn-1778333146541-ws9hg6vrq', 'invoice', '0798367330', 'roic', '888888', 'mnn', 100000.0000, 0.0000, 100000.0000, NULL, '2026-05-09', NULL, 'paid', 'bank', NULL, NULL, NULL, '2026-05-09 13:25:46', '2026-05-09 13:25:46'),
(3, 2, 'txn-1779391218942-ugepzg525', 'receipt', '0798367330', 'crops Rwanda ', '45678', 'crops ', 20000000.0000, 0.0000, 20000000.0000, NULL, '2026-05-21', NULL, 'paid', 'cheque', NULL, NULL, 'crops_purchase', '2026-05-21 19:20:19', '2026-05-21 19:20:19'),
(4, 2, 'txn-1779391356127-226j7e98k', 'invoice', '0798367330', 'roic', '45678', 'income ', 300000000.0000, 0.0000, 300000000.0000, NULL, '2026-05-21', NULL, 'paid', 'mobile_money', '0798367330', 'MP243568', NULL, '2026-05-21 19:22:36', '2026-05-21 19:22:36');

-- --------------------------------------------------------

--
-- Table structure for table `journal_entries`
--

CREATE TABLE `journal_entries` (
  `id` int(10) UNSIGNED NOT NULL,
  `company_id` int(10) UNSIGNED NOT NULL,
  `entry_date` date NOT NULL,
  `description` text NOT NULL,
  `entry_type` varchar(50) NOT NULL DEFAULT 'manual',
  `reference_no` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `journal_entries`
--

INSERT INTO `journal_entries` (`id`, `company_id`, `entry_date`, `description`, `entry_type`, `reference_no`, `created_at`, `updated_at`) VALUES
(1, 1, '2026-05-09', 'Crops purchase ', 'purchase', '0798367330', '2026-05-09 10:48:49', '2026-05-09 10:48:49'),
(2, 1, '2026-05-09', 'Payroll payment - Aimable Nzabonimpa - 2026-05', 'payment', 'PAYROLL-PAY-1', '2026-05-09 12:26:48', '2026-05-09 12:26:48'),
(3, 1, '2026-05-09', 'Payroll payment - Himbaza Heroic - 2026-05', 'payment', 'PAYROLL-PAY-2', '2026-05-09 12:35:31', '2026-05-09 12:35:31'),
(4, 1, '2026-05-09', 'Payroll accrual for 2026-05', 'payroll', 'PAYROLL-2026-05', '2026-05-09 13:15:57', '2026-05-09 13:15:57'),
(5, 1, '2026-05-09', 'mnn', 'sale', 'REF-txn-1778333146541-ws9hg6vrq', '2026-05-09 13:25:46', '2026-05-09 13:25:46'),
(6, 2, '2026-05-21', 'crops ', 'purchase', '0798367330', '2026-05-21 19:20:19', '2026-05-21 19:20:19'),
(7, 2, '2026-05-21', 'income ', 'sale', '0798367330', '2026-05-21 19:22:36', '2026-05-21 19:22:36');

-- --------------------------------------------------------

--
-- Table structure for table `meeting_minutes`
--

CREATE TABLE `meeting_minutes` (
  `id` int(10) UNSIGNED NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` varchar(36) NOT NULL DEFAULT uuid(),
  `company_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('alert','warning','info','reminder') NOT NULL DEFAULT 'info',
  `priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `due_date` datetime DEFAULT NULL,
  `action_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `company_id`, `title`, `message`, `type`, `priority`, `is_read`, `due_date`, `action_url`, `created_at`, `updated_at`) VALUES
('864c5f8b-4d51-11f1-9934-b05adab6cf6b', 1, 'Welcome to Office Manager', 'Your company management system is now active. Explore the features to manage your business efficiently.', 'info', 'low', 1, NULL, NULL, '2026-05-11 15:53:16', '2026-05-11 16:16:09'),
('865b00aa-4d51-11f1-9934-b05adab6cf6b', 1, 'Compliance Reminder', 'Annual tax filing deadline is approaching. Please review your tax obligations.', 'reminder', 'medium', 0, '2026-06-10 00:00:00', NULL, '2026-05-11 15:53:16', '2026-05-11 15:53:16'),
('865cbb5f-4d51-11f1-9934-b05adab6cf6b', 1, 'System Update Available', 'A new version of Office Manager is available with improved reporting features.', 'info', 'low', 0, NULL, NULL, '2026-05-11 15:53:16', '2026-05-11 15:53:16');

-- --------------------------------------------------------

--
-- Table structure for table `ownership_mappings`
--

CREATE TABLE `ownership_mappings` (
  `id` int(10) UNSIGNED NOT NULL,
  `company_id` int(10) UNSIGNED NOT NULL,
  `member_id` int(10) UNSIGNED NOT NULL,
  `beneficial_owner_id` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payroll_records`
--

CREATE TABLE `payroll_records` (
  `id` int(10) UNSIGNED NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `payroll_records`
--

INSERT INTO `payroll_records` (`id`, `company_id`, `employee_id`, `payroll_month`, `pay_date`, `gross_salary`, `paye_tax`, `rssb_employee`, `rssb_employer`, `net_salary`, `status`, `paid_at`, `accounting_journal_id`, `accounting_posted_at`, `created_at`, `updated_at`) VALUES
(1, 1, 1, '2026-05', '2026-05-09', 850000.0000, 123000.0000, 63750.0000, 63750.0000, 663250.0000, 'paid', '2026-05-09 12:26:48', 4, '2026-05-09 13:15:57', '2026-05-09 12:04:16', '2026-05-09 13:15:57'),
(2, 1, 9, '2026-05', '2026-05-09', 80000.0000, 7500.0000, 6000.0000, 6000.0000, 66500.0000, 'paid', '2026-05-09 12:35:31', 4, '2026-05-09 13:15:57', '2026-05-09 12:04:16', '2026-05-09 13:15:57'),
(3, 1, 5, '2026-05', '2026-05-09', 900000.0000, 130500.0000, 67500.0000, 67500.0000, 702000.0000, 'unpaid', NULL, 4, '2026-05-09 13:15:57', '2026-05-09 12:04:16', '2026-05-09 13:15:57'),
(4, 1, 3, '2026-05', '2026-05-09', 780000.0000, 112500.0000, 58500.0000, 58500.0000, 609000.0000, 'unpaid', NULL, 4, '2026-05-09 13:15:57', '2026-05-09 12:04:16', '2026-05-09 13:15:57'),
(5, 1, 2, '2026-05', '2026-05-09', 950000.0000, 138000.0000, 71250.0000, 71250.0000, 740750.0000, 'unpaid', NULL, 4, '2026-05-09 13:15:57', '2026-05-09 12:04:16', '2026-05-09 13:15:57'),
(6, 1, 4, '2026-05', '2026-05-09', 700000.0000, 100500.0000, 52500.0000, 52500.0000, 547000.0000, 'unpaid', NULL, 4, '2026-05-09 13:15:57', '2026-05-09 12:04:16', '2026-05-09 13:15:57'),
(7, 6, 10, '2026-05', '2026-05-20', 600000.0000, 85500.0000, 45000.0000, 45000.0000, 469500.0000, 'unpaid', NULL, NULL, NULL, '2026-05-20 16:37:34', '2026-05-20 16:37:34'),
(8, 2, 6, '2026-05', '2026-05-21', 1000000.0000, 145500.0000, 75000.0000, 75000.0000, 779500.0000, 'unpaid', NULL, NULL, NULL, '2026-05-21 19:27:46', '2026-05-21 19:27:46'),
(9, 2, 8, '2026-05', '2026-05-21', 820000.0000, 118500.0000, 61500.0000, 61500.0000, 640000.0000, 'unpaid', NULL, NULL, NULL, '2026-05-21 19:27:46', '2026-05-21 19:27:46'),
(10, 2, 7, '2026-05', '2026-05-21', 750000.0000, 108000.0000, 56250.0000, 56250.0000, 585750.0000, 'unpaid', NULL, NULL, NULL, '2026-05-21 19:27:46', '2026-05-21 19:27:46');

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`id`, `name`, `created_at`, `updated_at`) VALUES
(1, 'companies.view', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(2, 'companies.create', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(3, 'companies.edit', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(4, 'companies.delete', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(5, 'members.view', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(6, 'members.create', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(7, 'members.edit', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(8, 'members.delete', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(9, 'accounting.view', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(10, 'accounting.create', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(11, 'accounting.edit', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(12, 'payroll.view', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(13, 'payroll.create', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(14, 'payroll.approve', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(15, 'compliance.view', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(16, 'compliance.create', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(17, 'compliance.edit', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(18, 'documents.view', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(19, 'documents.upload', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(20, 'documents.delete', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(22, 'users.create', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(23, 'users.edit', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(24, 'users.delete', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(25, 'reports.view', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(26, 'reports.export', '2026-05-09 10:45:39', '2026-05-09 10:45:39');

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `created_at`, `updated_at`) VALUES
(1, 'Administrator', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(2, 'Manager', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(3, 'Accountant', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(4, 'Compliance Officer', '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(5, 'Viewer', '2026-05-09 10:45:39', '2026-05-09 10:45:39');

-- --------------------------------------------------------

--
-- Table structure for table `schema_migrations`
--

CREATE TABLE `schema_migrations` (
  `id` int(11) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `executed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `schema_migrations`
--

INSERT INTO `schema_migrations` (`id`, `filename`, `executed_at`) VALUES
(1, '001_create_notifications_table.sql', '2026-05-11 15:51:27'),
(2, '002_align_company_and_user_profile_columns.sql', '2026-05-20 16:34:15'),
(3, '003_add_company_logo_and_payroll_accounting_columns.sql', '2026-05-23 08:40:00'),
(4, '004_align_member_and_certificate_columns.sql', '2026-05-23 08:55:00');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `session_id` varchar(128) NOT NULL,
  `expires` int(10) UNSIGNED NOT NULL,
  `data` mediumtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`session_id`, `expires`, `data`) VALUES
('f0wj7jNmqzPstqVxNUOwLZc6ZqvbT4xw', 1779899975, '{\"cookie\":{\"originalMaxAge\":604800000,\"expires\":\"2026-05-27T16:32:46.086Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"authUserId\":6}'),
('UQC-jDVpfZLNnMmF4jK53tPUk6_FgfLM', 1779996499, '{\"cookie\":{\"originalMaxAge\":604800000,\"expires\":\"2026-05-28T19:18:09.162Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\",\"sameSite\":\"lax\"},\"authUserId\":6}');

-- --------------------------------------------------------

--
-- Table structure for table `share_certificates`
--

CREATE TABLE `share_certificates` (
  `id` int(10) UNSIGNED NOT NULL,
  `company_id` int(10) UNSIGNED NOT NULL,
  `member_id` int(10) UNSIGNED DEFAULT NULL,
  `certificate_no` varchar(100) DEFAULT NULL,
  `holder_name` varchar(255) DEFAULT NULL,
  `shares_count` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `issue_date` date DEFAULT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'active',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `share_transfer`
--

CREATE TABLE `share_transfer` (
  `id` int(10) UNSIGNED NOT NULL,
  `company_id` int(10) UNSIGNED NOT NULL,
  `from_member_id` int(10) UNSIGNED NOT NULL,
  `to_member_id` int(10) UNSIGNED NOT NULL,
  `shares_amount` decimal(20,4) NOT NULL DEFAULT 0.0000,
  `transaction_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `supporting_documents`
--

CREATE TABLE `supporting_documents` (
  `id` int(10) UNSIGNED NOT NULL,
  `company_id` int(10) UNSIGNED NOT NULL,
  `journal_entry_id` int(10) UNSIGNED NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tax_returns`
--

CREATE TABLE `tax_returns` (
  `id` int(10) UNSIGNED NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tax_returns`
--

INSERT INTO `tax_returns` (`id`, `company_id`, `tax_type`, `period`, `submission_date`, `total_declared`, `status`, `due_date`, `quarter`, `tax_year`, `payload_json`, `created_at`, `updated_at`) VALUES
(4, 6, 'QIT', 'Q3 2026', NULL, 18000.0000, 'Pending', '2026-09-30', 'Q3', '2026', '{\"quarter\":\"Q3\",\"year\":\"2026\",\"estimated_income\":60000,\"tax_rate\":30,\"tax_amount\":18000,\"paid\":false,\"due_date\":\"2026-09-30\"}', '2026-05-20 16:38:46', '2026-05-20 16:38:46');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `email` varchar(255) NOT NULL,
  `profile_picture_url` varchar(500) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role_id` int(10) UNSIGNED DEFAULT NULL,
  `department_id` int(10) UNSIGNED DEFAULT NULL,
  `status` enum('Active','Inactive','Suspended') NOT NULL DEFAULT 'Active',
  `last_login` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `profile_picture_url`, `password_hash`, `role_id`, `department_id`, `status`, `last_login`, `created_at`, `updated_at`) VALUES
(1, 'System Administrator', 'admin@system.rw', NULL, '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 1, 'Active', NULL, '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(2, 'Alice Uwase', 'alice@system.rw', NULL, '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 2, 2, 'Active', NULL, '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(3, 'Bob Nkurunziza', 'bob@system.rw', NULL, '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 3, 2, 'Active', NULL, '2026-05-09 10:45:39', '2026-05-09 11:48:58'),
(4, 'Claire Ingabire', 'claire@system.rw', NULL, '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 4, 3, 'Active', NULL, '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(5, 'David Hakizimana', 'david@system.rw', NULL, '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 5, 5, 'Active', NULL, '2026-05-09 10:45:39', '2026-05-09 10:45:39'),
(6, 'Himbaza  sem Heroic', 'himbazasemu23@gmail.com', NULL, '$2b$10$XiH2dRV6QAhHJdwFHTl0FexE5VlAnuy4Z3eqg2NNg0ulQCNbNA.J2', 1, 4, 'Active', '2026-05-21 19:18:09', '2026-05-09 10:47:37', '2026-05-21 19:18:09');

-- --------------------------------------------------------

--
-- Table structure for table `user_permissions`
--

CREATE TABLE `user_permissions` (
  `user_id` int(10) UNSIGNED NOT NULL,
  `permission_id` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user_permissions`
--

INSERT INTO `user_permissions` (`user_id`, `permission_id`) VALUES
(1, 1),
(1, 2),
(1, 3),
(1, 4),
(1, 5),
(1, 6),
(1, 7),
(1, 8),
(1, 9),
(1, 10),
(1, 11),
(1, 12),
(1, 13),
(1, 14),
(1, 15),
(1, 16),
(1, 17),
(1, 18),
(1, 19),
(1, 20),
(1, 22),
(1, 23),
(1, 24),
(1, 25),
(1, 26),
(2, 1),
(2, 5),
(2, 6),
(2, 7),
(2, 9),
(2, 12),
(2, 15),
(2, 18),
(2, 25),
(3, 10),
(6, 1),
(6, 2),
(6, 3),
(6, 4),
(6, 5),
(6, 6),
(6, 7),
(6, 8),
(6, 9),
(6, 10),
(6, 11),
(6, 12),
(6, 13),
(6, 14),
(6, 15),
(6, 16),
(6, 17),
(6, 18),
(6, 19),
(6, 20),
(6, 22),
(6, 23),
(6, 24),
(6, 25),
(6, 26);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `accounts`
--
ALTER TABLE `accounts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_accounts_company_code` (`company_id`,`code`);

--
-- Indexes for table `beneficial_owners`
--
ALTER TABLE `beneficial_owners`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_bo_company` (`company_id`);

--
-- Indexes for table `beneficial_owner_documents`
--
ALTER TABLE `beneficial_owner_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_bod_bo` (`beneficial_owner_id`);

--
-- Indexes for table `business_plans`
--
ALTER TABLE `business_plans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_bp_company` (`company_id`);

--
-- Indexes for table `capital_entries`
--
ALTER TABLE `capital_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_ce_company` (`company_id`),
  ADD KEY `fk_ce_shareholder` (`shareholder_id`);

--
-- Indexes for table `client_supplier_registers`
--
ALTER TABLE `client_supplier_registers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_csr_company` (`company_id`);

--
-- Indexes for table `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `company_capital_structure`
--
ALTER TABLE `company_capital_structure`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `company_id` (`company_id`);

--
-- Indexes for table `company_charges`
--
ALTER TABLE `company_charges`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_cc_company` (`company_id`);

--
-- Indexes for table `company_documents`
--
ALTER TABLE `company_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_cd_company` (`company_id`);

--
-- Indexes for table `company_members`
--
ALTER TABLE `company_members`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_cm_company` (`company_id`);

--
-- Indexes for table `company_settings`
--
ALTER TABLE `company_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `company_id` (`company_id`);

--
-- Indexes for table `complaint_risk_issues`
--
ALTER TABLE `complaint_risk_issues`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_cri_company` (`company_id`);

--
-- Indexes for table `compliance_alerts`
--
ALTER TABLE `compliance_alerts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_ca_company` (`company_id`);

--
-- Indexes for table `compliance_deadlines`
--
ALTER TABLE `compliance_deadlines`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_cld_company` (`company_id`);

--
-- Indexes for table `contract`
--
ALTER TABLE `contract`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_con_company` (`company_id`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `dividend_declarations`
--
ALTER TABLE `dividend_declarations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_dd_company` (`company_id`);

--
-- Indexes for table `dividend_distributions`
--
ALTER TABLE `dividend_distributions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_dist_declaration` (`declaration_id`);

--
-- Indexes for table `document_vault`
--
ALTER TABLE `document_vault`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_dv_company` (`company_id`);

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_emp_company` (`company_id`);

--
-- Indexes for table `fixed_assets`
--
ALTER TABLE `fixed_assets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_fa_company` (`company_id`);

--
-- Indexes for table `general_ledger`
--
ALTER TABLE `general_ledger`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_gl_company` (`company_id`),
  ADD KEY `fk_gl_je` (`journal_entry_id`),
  ADD KEY `fk_gl_account` (`account_id`);

--
-- Indexes for table `internal_audit_reports`
--
ALTER TABLE `internal_audit_reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_iar_company` (`company_id`);

--
-- Indexes for table `invoice`
--
ALTER TABLE `invoice`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_inv_company` (`company_id`);

--
-- Indexes for table `journal_entries`
--
ALTER TABLE `journal_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_je_company` (`company_id`);

--
-- Indexes for table `meeting_minutes`
--
ALTER TABLE `meeting_minutes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_mm_company` (`company_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_company_id` (`company_id`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_is_read` (`is_read`);

--
-- Indexes for table `ownership_mappings`
--
ALTER TABLE `ownership_mappings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_om_company` (`company_id`),
  ADD KEY `fk_om_member` (`member_id`),
  ADD KEY `fk_om_bo` (`beneficial_owner_id`);

--
-- Indexes for table `payroll_records`
--
ALTER TABLE `payroll_records`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_payroll_emp_month` (`company_id`,`employee_id`,`payroll_month`),
  ADD KEY `fk_pr_employee` (`employee_id`),
  ADD KEY `idx_pr_accounting_journal` (`accounting_journal_id`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `schema_migrations`
--
ALTER TABLE `schema_migrations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `filename` (`filename`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`session_id`),
  ADD KEY `idx_sessions_expires` (`expires`);

--
-- Indexes for table `share_certificates`
--
ALTER TABLE `share_certificates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_sc_company` (`company_id`),
  ADD KEY `fk_sc_member` (`member_id`);

--
-- Indexes for table `share_transfer`
--
ALTER TABLE `share_transfer`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_st_company` (`company_id`),
  ADD KEY `fk_st_from` (`from_member_id`),
  ADD KEY `fk_st_to` (`to_member_id`);

--
-- Indexes for table `supporting_documents`
--
ALTER TABLE `supporting_documents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_sd_company` (`company_id`),
  ADD KEY `fk_sd_je` (`journal_entry_id`);

--
-- Indexes for table `tax_returns`
--
ALTER TABLE `tax_returns`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_tr_company` (`company_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `fk_users_role` (`role_id`),
  ADD KEY `fk_users_department` (`department_id`);

--
-- Indexes for table `user_permissions`
--
ALTER TABLE `user_permissions`
  ADD PRIMARY KEY (`user_id`,`permission_id`),
  ADD KEY `fk_up_permission` (`permission_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `accounts`
--
ALTER TABLE `accounts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=85;

--
-- AUTO_INCREMENT for table `beneficial_owners`
--
ALTER TABLE `beneficial_owners`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `beneficial_owner_documents`
--
ALTER TABLE `beneficial_owner_documents`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `business_plans`
--
ALTER TABLE `business_plans`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `capital_entries`
--
ALTER TABLE `capital_entries`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `client_supplier_registers`
--
ALTER TABLE `client_supplier_registers`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `companies`
--
ALTER TABLE `companies`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `company_capital_structure`
--
ALTER TABLE `company_capital_structure`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `company_charges`
--
ALTER TABLE `company_charges`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `company_documents`
--
ALTER TABLE `company_documents`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `company_members`
--
ALTER TABLE `company_members`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `company_settings`
--
ALTER TABLE `company_settings`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `complaint_risk_issues`
--
ALTER TABLE `complaint_risk_issues`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `compliance_alerts`
--
ALTER TABLE `compliance_alerts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `compliance_deadlines`
--
ALTER TABLE `compliance_deadlines`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `contract`
--
ALTER TABLE `contract`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `dividend_declarations`
--
ALTER TABLE `dividend_declarations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `dividend_distributions`
--
ALTER TABLE `dividend_distributions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `document_vault`
--
ALTER TABLE `document_vault`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `fixed_assets`
--
ALTER TABLE `fixed_assets`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `general_ledger`
--
ALTER TABLE `general_ledger`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `internal_audit_reports`
--
ALTER TABLE `internal_audit_reports`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `invoice`
--
ALTER TABLE `invoice`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `journal_entries`
--
ALTER TABLE `journal_entries`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `meeting_minutes`
--
ALTER TABLE `meeting_minutes`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ownership_mappings`
--
ALTER TABLE `ownership_mappings`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `payroll_records`
--
ALTER TABLE `payroll_records`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `schema_migrations`
--
ALTER TABLE `schema_migrations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `share_certificates`
--
ALTER TABLE `share_certificates`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `share_transfer`
--
ALTER TABLE `share_transfer`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `supporting_documents`
--
ALTER TABLE `supporting_documents`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tax_returns`
--
ALTER TABLE `tax_returns`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `accounts`
--
ALTER TABLE `accounts`
  ADD CONSTRAINT `fk_acc_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `beneficial_owners`
--
ALTER TABLE `beneficial_owners`
  ADD CONSTRAINT `fk_bo_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `beneficial_owner_documents`
--
ALTER TABLE `beneficial_owner_documents`
  ADD CONSTRAINT `fk_bod_bo` FOREIGN KEY (`beneficial_owner_id`) REFERENCES `beneficial_owners` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `business_plans`
--
ALTER TABLE `business_plans`
  ADD CONSTRAINT `fk_bp_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `capital_entries`
--
ALTER TABLE `capital_entries`
  ADD CONSTRAINT `fk_ce_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_ce_shareholder` FOREIGN KEY (`shareholder_id`) REFERENCES `company_members` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `client_supplier_registers`
--
ALTER TABLE `client_supplier_registers`
  ADD CONSTRAINT `fk_csr_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `company_capital_structure`
--
ALTER TABLE `company_capital_structure`
  ADD CONSTRAINT `fk_ccs_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `company_charges`
--
ALTER TABLE `company_charges`
  ADD CONSTRAINT `fk_cc_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `company_documents`
--
ALTER TABLE `company_documents`
  ADD CONSTRAINT `fk_cd_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `company_members`
--
ALTER TABLE `company_members`
  ADD CONSTRAINT `fk_cm_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `company_settings`
--
ALTER TABLE `company_settings`
  ADD CONSTRAINT `fk_cs_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `complaint_risk_issues`
--
ALTER TABLE `complaint_risk_issues`
  ADD CONSTRAINT `fk_cri_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `compliance_alerts`
--
ALTER TABLE `compliance_alerts`
  ADD CONSTRAINT `fk_ca_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `compliance_deadlines`
--
ALTER TABLE `compliance_deadlines`
  ADD CONSTRAINT `fk_cld_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `contract`
--
ALTER TABLE `contract`
  ADD CONSTRAINT `fk_con_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `dividend_declarations`
--
ALTER TABLE `dividend_declarations`
  ADD CONSTRAINT `fk_dd_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `dividend_distributions`
--
ALTER TABLE `dividend_distributions`
  ADD CONSTRAINT `fk_dist_declaration` FOREIGN KEY (`declaration_id`) REFERENCES `dividend_declarations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `document_vault`
--
ALTER TABLE `document_vault`
  ADD CONSTRAINT `fk_dv_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `employees`
--
ALTER TABLE `employees`
  ADD CONSTRAINT `fk_emp_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `fixed_assets`
--
ALTER TABLE `fixed_assets`
  ADD CONSTRAINT `fk_fa_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `general_ledger`
--
ALTER TABLE `general_ledger`
  ADD CONSTRAINT `fk_gl_account` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_gl_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_gl_je` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `internal_audit_reports`
--
ALTER TABLE `internal_audit_reports`
  ADD CONSTRAINT `fk_iar_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `invoice`
--
ALTER TABLE `invoice`
  ADD CONSTRAINT `fk_inv_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `journal_entries`
--
ALTER TABLE `journal_entries`
  ADD CONSTRAINT `fk_je_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `meeting_minutes`
--
ALTER TABLE `meeting_minutes`
  ADD CONSTRAINT `fk_mm_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `ownership_mappings`
--
ALTER TABLE `ownership_mappings`
  ADD CONSTRAINT `fk_om_bo` FOREIGN KEY (`beneficial_owner_id`) REFERENCES `company_members` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_om_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_om_member` FOREIGN KEY (`member_id`) REFERENCES `company_members` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `payroll_records`
--
ALTER TABLE `payroll_records`
  ADD CONSTRAINT `fk_pr_accounting_journal` FOREIGN KEY (`accounting_journal_id`) REFERENCES `journal_entries` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pr_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pr_employee` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `share_certificates`
--
ALTER TABLE `share_certificates`
  ADD CONSTRAINT `fk_sc_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_sc_member` FOREIGN KEY (`member_id`) REFERENCES `company_members` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `share_transfer`
--
ALTER TABLE `share_transfer`
  ADD CONSTRAINT `fk_st_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_st_from` FOREIGN KEY (`from_member_id`) REFERENCES `company_members` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_st_to` FOREIGN KEY (`to_member_id`) REFERENCES `company_members` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `supporting_documents`
--
ALTER TABLE `supporting_documents`
  ADD CONSTRAINT `fk_sd_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_sd_je` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tax_returns`
--
ALTER TABLE `tax_returns`
  ADD CONSTRAINT `fk_tr_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `fk_users_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `user_permissions`
--
ALTER TABLE `user_permissions`
  ADD CONSTRAINT `fk_up_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_up_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
