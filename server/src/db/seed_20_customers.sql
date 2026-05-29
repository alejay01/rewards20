-- =====================================================================
-- THE BOUDIN COMPANY REWARDS - 20 TEST CUSTOMERS SQL SEEDING SCRIPT
-- =====================================================================

-- This script inserts 20 realistic Cajun-named loyalty members with
-- diverse points, visits, tiers, and easily scannable QR tokens.

-- Make sure to select your rewards database (e.g. u444395404_rewards) before running this script.

-- 1. CLEAR EXISTING CUSTOMERS AND LOYALTY DETAILS (to avoid duplicate key conflicts)
DELETE FROM `points_ledger`;
DELETE FROM `visits`;
DELETE FROM `purchases`;
DELETE FROM `loyalty_accounts`;
DELETE FROM `customers`;

-- 2. INSERT 20 CAJUN CUSTOMERS
INSERT INTO `customers` (`id`, `public_id`, `first_name`, `last_name`, `email`, `phone`, `birthday`, `favorite_category`, `consent_promotions`, `status`) VALUES
(1, 'uuid-customer-1', 'Jean-Luc', 'Landry', 'jeanluc@cajun.com', '281-555-1001', '1980-04-12', 'Boudin Links', 1, 'active'),
(2, 'uuid-customer-2', 'Cherie', 'Babineaux', 'cherie@bayou.com', '832-555-1002', '1988-09-24', 'Boudin Balls', 1, 'active'),
(3, 'uuid-customer-3', 'Alphonse', 'Hebert', 'alphonse@smokehouse.com', '713-555-1003', '1975-11-05', 'Gumbo', 1, 'active'),
(4, 'uuid-customer-4', 'Evangeline', 'Arceneaux', 'evangeline@gumbo.com', '281-555-1004', '1992-06-18', 'Crawfish Pie', 1, 'active'),
(5, 'uuid-customer-5', 'Remy', 'Lebeau', 'remy@boss.com', '832-555-1005', '1985-02-14', 'Daiquiri', 1, 'active'),
(6, 'uuid-customer-6', 'Clovis', 'Thibodeaux', 'clovis@bayou.com', '281-555-1006', '1990-07-29', 'Boudin Links', 1, 'active'),
(7, 'uuid-customer-7', 'Marcelite', 'Gaudet', 'marcelite@swamp.com', '713-555-1007', '1983-12-01', 'Boudin Balls', 1, 'active'),
(8, 'uuid-customer-8', 'Hypolite', 'Boudreaux', 'hypolite@pitmaster.com', '832-555-1008', '1968-03-10', 'Gumbo', 1, 'active'),
(9, 'uuid-customer-9', 'Feliciana', 'Mouton', 'feliciana@cajun.com', '281-555-1009', '1995-10-22', 'Crawfish Pie', 1, 'active'),
(10, 'uuid-customer-10', 'Placide', 'Broussard', 'placide@creole.com', '713-555-1010', '1979-05-15', 'Daiquiri', 1, 'active'),
(11, 'uuid-customer-11', 'Zoe', 'Fontenot', 'zoe@bayou.com', '832-555-1011', '1993-01-30', 'Boudin Links', 1, 'active'),
(12, 'uuid-customer-12', 'Elie', 'Guidry', 'elie@smokehouse.com', '281-555-1012', '1987-08-08', 'Boudin Balls', 1, 'active'),
(13, 'uuid-customer-13', 'Sidonie', 'LeBlanc', 'sidonie@gumbo.com', '713-555-1013', '1972-04-03', 'Gumbo', 1, 'active'),
(14, 'uuid-customer-14', 'Theodule', 'Richard', 'theodule@pitmaster.com', '832-555-1014', '1965-11-20', 'Crawfish Pie', 1, 'active'),
(15, 'uuid-customer-15', 'Philomene', 'Melancon', 'philomene@swamp.com', '281-555-1015', '1991-09-12', 'Daiquiri', 1, 'active'),
(16, 'uuid-customer-16', 'Onezime', 'Breaux', 'onezime@cajun.com', '713-555-1016', '1984-06-01', 'Boudin Links', 1, 'active'),
(17, 'uuid-customer-17', 'Eulalie', 'Cormier', 'eulalie@bayou.com', '832-555-1017', '1989-02-28', 'Boudin Balls', 1, 'active'),
(18, 'uuid-customer-18', 'Achille', 'Peltier', 'achille@smokehouse.com', '281-555-1018', '1978-07-14', 'Gumbo', 1, 'active'),
(19, 'uuid-customer-19', 'Zeline', 'Trahan', 'zeline@gumbo.com', '713-555-1019', '1994-03-19', 'Crawfish Pie', 1, 'active'),
(20, 'uuid-customer-20', 'Octave', 'Dugas', 'octave@pitmaster.com', '832-555-1020', '1960-12-25', 'Daiquiri', 1, 'active');

-- 3. INSERT LOYALTY ACCOUNTS FOR THE 20 CUSTOMERS
-- Includes different starting point balances, visits, spend, tiers, and pre-computed tokens!
INSERT INTO `loyalty_accounts` (`id`, `customer_id`, `rewards_number`, `public_qr_token`, `barcode_value`, `points_balance`, `lifetime_points`, `total_visits`, `lifetime_spend`, `current_tier_id`) VALUES
-- Tiers: 1 = Rookie Roller, 2 = Bayou Buddy, 3 = Boudin Regular, 4 = Hot Cheeto Hero, 5 = Gumbo Gold, 6 = Pit Boss, 7 = Smokehouse Legend
(1, 1, 'BCR-100001', 'token_customer_1', 'BAR-100001', 0, 0, 0, 0.00, 1),
(2, 2, 'BCR-100002', 'token_customer_2', 'BAR-100002', 15, 15, 1, 15.50, 1),
(3, 3, 'BCR-100003', 'token_customer_3', 'BAR-100003', 35, 35, 3, 32.20, 2),
(4, 4, 'BCR-100004', 'token_customer_4', 'BAR-100004', 42, 42, 4, 48.00, 2),
(5, 5, 'BCR-100005', 'token_customer_5', 'BAR-100005', 68, 68, 5, 56.40, 3),
(6, 6, 'BCR-100006', 'token_customer_6', 'BAR-100006', 75, 75, 6, 72.80, 3),
(7, 7, 'BCR-100007', 'token_customer_7', 'BAR-100007', 105, 105, 10, 112.50, 4),
(8, 8, 'BCR-100008', 'token_customer_8', 'BAR-100008', 115, 115, 11, 124.90, 4),
(9, 9, 'BCR-100009', 'token_customer_9', 'BAR-100009', 155, 155, 15, 158.30, 5),
(10, 10, 'BCR-100010', 'token_customer_10', 'BAR-100010', 165, 165, 16, 172.10, 5),
(11, 11, 'BCR-100011', 'token_customer_11', 'BAR-100011', 205, 205, 20, 214.60, 6),
(12, 12, 'BCR-100012', 'token_customer_12', 'BAR-100012', 220, 220, 21, 235.00, 6),
(13, 13, 'BCR-100013', 'token_customer_13', 'BAR-100013', 350, 350, 30, 362.40, 7),
(14, 14, 'BCR-100014', 'token_customer_14', 'BAR-100014', 380, 380, 32, 395.00, 7),
(15, 15, 'BCR-100015', 'token_customer_15', 'BAR-100015', 10, 10, 1, 12.00, 1),
(16, 16, 'BCR-100016', 'token_customer_16', 'BAR-100016', 30, 30, 3, 30.00, 2),
(17, 17, 'BCR-100017', 'token_customer_17', 'BAR-100017', 55, 55, 5, 52.00, 3),
(18, 18, 'BCR-100018', 'token_customer_18', 'BAR-100018', 120, 120, 11, 130.00, 4),
(19, 19, 'BCR-100019', 'token_customer_19', 'BAR-100019', 180, 180, 16, 185.00, 5),
(20, 20, 'BCR-100020', 'token_customer_20', 'BAR-100020', 250, 250, 22, 260.00, 6);

-- 4. LOG POINTS LEDGER ENTRIES FOR REALISM
INSERT INTO `points_ledger` (`customer_id`, `loyalty_account_id`, `type`, `points_change`, `balance_after`, `reason`, `source`) VALUES
(2, 2, 'earn_visit', 15, 15, 'Initial shop check-in and scan.', 'tablet'),
(3, 3, 'earn_visit', 35, 35, 'Loyalty points accrued from Bayou check-ins.', 'tablet'),
(4, 4, 'earn_visit', 42, 42, 'Accumulated visit check-in rewards.', 'tablet'),
(5, 5, 'earn_visit', 68, 68, 'Scan check-ins points credit.', 'tablet'),
(6, 6, 'earn_visit', 75, 75, 'Boudin Regular check-ins.', 'tablet'),
(7, 7, 'earn_visit', 105, 105, 'Hot Cheeto Hero milestone check-ins.', 'tablet'),
(8, 8, 'earn_visit', 115, 115, 'Loyalty visit point credits.', 'tablet'),
(9, 9, 'earn_visit', 155, 155, 'Gumbo Gold milestone tier points credit.', 'tablet'),
(10, 10, 'earn_visit', 165, 165, 'Shop visits points ledger addition.', 'tablet'),
(11, 11, 'earn_visit', 205, 205, 'Pit Boss milestone scan check-ins.', 'tablet'),
(12, 12, 'earn_visit', 220, 220, 'Accumulated counter scan points.', 'tablet'),
(13, 13, 'earn_visit', 350, 350, 'Ultimate Smokehouse Legend points credit.', 'tablet'),
(14, 14, 'earn_visit', 380, 380, 'Accumulated Pitmaster check-ins points.', 'tablet'),
(15, 15, 'earn_visit', 10, 10, 'Rookie check-in visit.', 'tablet'),
(16, 16, 'earn_visit', 30, 30, 'Bayou Buddy visit check-in points.', 'tablet'),
(17, 17, 'earn_visit', 55, 55, 'Boudin Regular scan points.', 'tablet'),
(18, 18, 'earn_visit', 120, 120, 'Hot Cheeto Hero milestone.', 'tablet'),
(19, 19, 'earn_visit', 180, 180, 'Gumbo Gold milestone points.', 'tablet'),
(20, 20, 'earn_visit', 250, 250, 'Pit Boss check-ins points ledger.', 'tablet');

-- =====================================================================
-- END OF SCRIPT
-- =====================================================================
