"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./index");
const schema_1 = require("./schema");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const drizzle_orm_1 = require("drizzle-orm");
async function main() {
    console.log("Seeding database with MVP rewards data...");
    try {
        // 1. Clear existing data (in reverse order of foreign keys)
        console.log("Clearing existing tables...");
        await index_1.db.delete(schema_1.settings);
        await index_1.db.delete(schema_1.pointsLedger);
        await index_1.db.delete(schema_1.purchases);
        await index_1.db.delete(schema_1.visits);
        await index_1.db.delete(schema_1.loyaltyAccounts);
        await index_1.db.delete(schema_1.customers);
        await index_1.db.delete(schema_1.promotions);
        await index_1.db.delete(schema_1.rewards);
        await index_1.db.delete(schema_1.tiers);
        await index_1.db.delete(schema_1.staffUsers);
        await index_1.db.delete(schema_1.rolePermissions);
        await index_1.db.delete(schema_1.permissions);
        await index_1.db.delete(schema_1.roles);
        console.log("Existing tables cleared.");
        // 2. Seed Roles
        console.log("Seeding roles...");
        const roleAdmin = await index_1.db.insert(schema_1.roles).values({ name: "Administrator", description: "Full access control" });
        const roleManager = await index_1.db.insert(schema_1.roles).values({ name: "Manager", description: "Can manage store staff, redemptions, and view logs" });
        const roleTeam = await index_1.db.insert(schema_1.roles).values({ name: "Team Member", description: "Can scan, view status, and award standard points/visits" });
        // Retrieve inserted roles IDs
        const allRoles = await index_1.db.select().from(schema_1.roles);
        const adminRoleId = allRoles.find(r => r.name === "Administrator").id;
        const managerRoleId = allRoles.find(r => r.name === "Manager").id;
        const teamRoleId = allRoles.find(r => r.name === "Team Member").id;
        // 3. Seed Permissions
        console.log("Seeding permissions...");
        const permKeys = [
            { key: "full_access", description: "Full administrator privileges" },
            { key: "add_points", description: "Add customer points/visits" },
            { key: "subtract_points", description: "Subtract customer points" },
            { key: "redeem_rewards", description: "Redeem customer loyalty rewards" },
            { key: "approve_overrides", description: "Approve duplicate visits or high-value rewards" },
            { key: "manage_staff", description: "Create and edit staff users" },
            { key: "manage_rewards", description: "Create and edit rewards" },
            { key: "manage_tiers", description: "Create and edit loyalty tiers" },
            { key: "manage_promotions", description: "Create and edit specials/promotions" },
            { key: "view_audit_logs", description: "View secure system audit logs" },
            { key: "view_analytics", description: "View store reports and overview charts" },
            { key: "manage_settings", description: "Configure system points ratios and fraud rules" }
        ];
        for (const p of permKeys) {
            await index_1.db.insert(schema_1.permissions).values(p);
        }
        const allPerms = await index_1.db.select().from(schema_1.permissions);
        // Helper to map key to ID
        const getPermId = (key) => allPerms.find(p => p.key === key).id;
        // 4. Seed Role Permissions mapping
        console.log("Mapping role permissions...");
        // Admin has full_access plus all others
        for (const p of allPerms) {
            await index_1.db.insert(schema_1.rolePermissions).values({ roleId: adminRoleId, permissionId: p.id });
        }
        // Manager permissions
        const managerPerms = [
            "add_points", "subtract_points", "redeem_rewards", "approve_overrides",
            "view_analytics", "manage_promotions"
        ];
        for (const key of managerPerms) {
            await index_1.db.insert(schema_1.rolePermissions).values({ roleId: managerRoleId, permissionId: getPermId(key) });
        }
        // Team Member permissions
        const teamPerms = ["add_points", "redeem_rewards"];
        for (const key of teamPerms) {
            await index_1.db.insert(schema_1.rolePermissions).values({ roleId: teamRoleId, permissionId: getPermId(key) });
        }
        // 5. Seed Staff Users (Demo credentials)
        console.log("Seeding staff users...");
        const demoPasswordHash = bcryptjs_1.default.hashSync("BoudinBoss2026!", 10);
        const demoPinHash = bcryptjs_1.default.hashSync("1234", 10); // Standard override PIN for managers
        await index_1.db.insert(schema_1.staffUsers).values({
            name: "T-Boy Boudreaux",
            email: "admin@theboudincompany.com",
            passwordHash: demoPasswordHash,
            pinHash: demoPinHash,
            roleId: adminRoleId,
            active: true
        });
        await index_1.db.insert(schema_1.staffUsers).values({
            name: "Marie Thibodeaux",
            email: "manager@theboudincompany.com",
            passwordHash: demoPasswordHash,
            pinHash: demoPinHash,
            roleId: managerRoleId,
            active: true
        });
        await index_1.db.insert(schema_1.staffUsers).values({
            name: "Clint Arceneaux",
            email: "team@theboudincompany.com",
            passwordHash: demoPasswordHash,
            pinHash: null,
            roleId: teamRoleId,
            active: true
        });
        const allStaff = await index_1.db.select().from(schema_1.staffUsers);
        const adminStaffId = allStaff.find(s => s.email === "admin@theboudincompany.com").id;
        // 6. Seed Tiers
        console.log("Seeding loyalty tiers...");
        const tierData = [
            { name: "Rookie Roller", description: "Just rolled in. Welcome to the Cajun smokehouse family!", visitsRequired: 0, spendRequired: "0.00", pointsRequired: 0, badgeImage: "badge-rookie-roller.png", unlockMessage: "Welcome to the Boudin Boss Loyalty Club! Scan and eat your way up!", sortOrder: 1 },
            { name: "Bayou Buddy", description: "You are a friend of the swamp. Stop by and grab a boudin link!", visitsRequired: 3, spendRequired: "30.00", pointsRequired: 30, badgeImage: "badge-bayou-buddy.png", unlockMessage: "Cajun status unlocked: You're now an official Bayou Buddy! Enjoy 5% extra on points today!", sortOrder: 2 },
            { name: "Boudin Regular", description: "You know your links! Getting closer to becoming a true boss.", visitsRequired: 5, spendRequired: "50.00", pointsRequired: 50, badgeImage: "badge-boudin-regular.png", unlockMessage: "Aw yeah! You're a Boudin Regular. Treat yourself to a free side on us!", sortOrder: 3 },
            { name: "Hot Cheeto Hero", description: "Spiced up and crispy! You love those crunch-coated boudin balls.", visitsRequired: 10, spendRequired: "100.00", pointsRequired: 100, badgeImage: "badge-hot-cheeto-hero.png", unlockMessage: "You're a Hot Cheeto Hero! Feelin' spicy! Go claim some hot boudin balls at the counter!", sortOrder: 4 },
            { name: "Gumbo Gold", description: "Pouring it on! Golden roux, slow simmered, pure perfection.", visitsRequired: 15, spendRequired: "150.00", pointsRequired: 150, badgeImage: "badge-gumbo-gold.png", unlockMessage: "Splendid! You hit Gumbo Gold. You're a local legend. Double points on Gumbo weekends!", sortOrder: 5 },
            { name: "Boudin Boss", description: "You rule the pits. Rosenberg, Texas honors your appetite!", visitsRequired: 20, spendRequired: "200.00", pointsRequired: 200, badgeImage: "badge-boudin-boss.png", unlockMessage: "BOUDIN BOSS status unlocked! The Pitmaster salutes you. Check your app for Boss-only secret specials!", sortOrder: 6 },
            { name: "VIP Smokehouse Legend", description: "Ultimate smokehouse royalty. You've earned the golden cleaver!", visitsRequired: 30, spendRequired: "350.00", pointsRequired: 350, badgeImage: "badge-vip-smokehouse-legend.png", unlockMessage: "You are a VIP Smokehouse Legend! The absolute highest tier! Wear the crown and enjoy your free smokehouse legend VIP t-shirt!", sortOrder: 7 }
        ];
        for (const t of tierData) {
            await index_1.db.insert(schema_1.tiers).values(t);
        }
        const allTiers = await index_1.db.select().from(schema_1.tiers);
        const rookieTierId = allTiers.find(t => t.name === "Rookie Roller").id;
        const buddyTierId = allTiers.find(t => t.name === "Bayou Buddy").id;
        const regularTierId = allTiers.find(t => t.name === "Boudin Regular").id;
        const heroTierId = allTiers.find(t => t.name === "Hot Cheeto Hero").id;
        const goldTierId = allTiers.find(t => t.name === "Gumbo Gold").id;
        const bossTierId = allTiers.find(t => t.name === "Boudin Boss").id;
        // 7. Seed Rewards
        console.log("Seeding rewards thresholds...");
        const rewardsData = [
            // Visit-based
            { name: "Free Drink Upgrade", description: "Upgrade your medium sweet tea or soda to a large.", rewardType: "visit", visitsRequired: 3, pointsRequired: 50, spendRequired: "0.00", active: true, highValue: false, managerApprovalRequired: false },
            { name: "Free Small Side", description: "Get a free small order of fries, okra, or dirty rice.", rewardType: "visit", visitsRequired: 5, pointsRequired: 100, spendRequired: "0.00", active: true, highValue: false, managerApprovalRequired: false },
            { name: "Free Boudin Ball", description: "Indulge in a piping-hot, crispy-fried traditional Boudin Ball.", rewardType: "visit", visitsRequired: 10, pointsRequired: 150, spendRequired: "0.00", active: true, highValue: false, managerApprovalRequired: false },
            { name: "Free Dessert or Tea Cake", description: "Enjoy a freshly-baked Southern tea cake or sweet potato pie slice.", rewardType: "visit", visitsRequired: 15, pointsRequired: 250, spendRequired: "0.00", active: true, highValue: false, managerApprovalRequired: false },
            { name: "Boudin Boss Reward", description: "Get a free Boudin Link basket with two regular sides.", rewardType: "visit", visitsRequired: 20, pointsRequired: 400, spendRequired: "0.00", active: true, highValue: true, managerApprovalRequired: false },
            // Spend-based
            { name: "Free The Boudin Company T-Shirt", description: "Show your pride with our custom Boudin Company tee.", rewardType: "spend", spendRequired: "75.00", pointsRequired: 300, active: true, highValue: true, managerApprovalRequired: true },
            { name: "Premium Smokehouse Combo", description: "Get a free 2-meat sampler plate with ribs and sausage.", rewardType: "spend", spendRequired: "100.00", pointsRequired: 400, active: true, highValue: true, managerApprovalRequired: true },
            { name: "VIP Smokehouse Legend Feast", description: "A massive smokehouse platter to share, or feast alone like a legend.", rewardType: "spend", spendRequired: "150.00", pointsRequired: 600, active: true, highValue: true, managerApprovalRequired: true },
            // Points-based (matching descriptions)
            { name: "Free Drink Upgrade (Points)", description: "Claim a drink upgrade using your points.", rewardType: "points", pointsRequired: 50, active: true, highValue: false, managerApprovalRequired: false },
            { name: "Free Side (Points)", description: "Grab any regular side using 100 points.", rewardType: "points", pointsRequired: 100, active: true, highValue: false, managerApprovalRequired: false },
            { name: "Free Boudin Ball (Points)", description: "A hot boudin ball, fried fresh, for 150 points.", rewardType: "points", pointsRequired: 150, active: true, highValue: false, managerApprovalRequired: false },
            { name: "Free Combo Discount (Points)", description: "$5 off any classic pitmaster combo plate using points.", rewardType: "points", pointsRequired: 250, active: true, highValue: false, managerApprovalRequired: false },
            { name: "Free Shirt or Premium Reward (Points)", description: "Standard logo tee or premium combo for 500 points.", rewardType: "points", pointsRequired: 500, active: true, highValue: true, managerApprovalRequired: true }
        ];
        for (const r of rewardsData) {
            await index_1.db.insert(schema_1.rewards).values(r);
        }
        // 8. Seed Promotions
        console.log("Seeding active promotions...");
        const today = new Date();
        const nextMonth = new Date();
        nextMonth.setMonth(today.getMonth() + 1);
        const lastMonth = new Date();
        lastMonth.setMonth(today.getMonth() - 1);
        const promotionsData = [
            { title: "Double Points Today", description: "Get 2x points on all purchases today! Scan at checkout to earn.", audienceType: "all", startDate: lastMonth, endDate: nextMonth, active: true, featured: true, doublePoints: true, createdBy: adminStaffId },
            { title: "Flamin’ Hot Friday Special", description: "Double points on all crispy, crunch-coated Hot Cheeto Boudin Balls this and every Friday!", audienceType: "all", startDate: lastMonth, endDate: nextMonth, active: true, featured: false, doublePoints: false, createdBy: adminStaffId },
            { title: "Gumbo Weekend Special", description: "Simmer down! Enjoy a free soft drink with any regular gumbo purchase on Saturdays and Sundays.", audienceType: "all", startDate: lastMonth, endDate: nextMonth, active: true, featured: true, doublePoints: false, createdBy: adminStaffId },
            { title: "$5 off your next $10 purchase", description: "A special discount for our regular customers. Check in 3 times this month to claim.", audienceType: "all", startDate: lastMonth, endDate: nextMonth, active: true, featured: false, doublePoints: false, createdBy: adminStaffId },
            { title: "Free Drink Upgrade Day", description: "Buy any links basket and get an automatic large sweet tea or soda upgrade!", audienceType: "all", startDate: lastMonth, endDate: nextMonth, active: true, featured: false, doublePoints: false, createdBy: adminStaffId }
        ];
        for (const p of promotionsData) {
            await index_1.db.insert(schema_1.promotions).values(p);
        }
        // 9. Seed 5 Demo Customers (Cajun Names!)
        console.log("Seeding Cajun demo customers & loyalty profiles...");
        const demoCustomers = [
            { firstName: "Boudreaux", lastName: "Thibodeaux", email: "boudreaux@bayou.com", phone: "281-555-0101", points: 0, visits: 0, spend: "0.00", tierId: rookieTierId, qr: "token_boudreaux_rookie_99" },
            { firstName: "Clotile", lastName: "Hebert", email: "clotile@cajun.com", phone: "832-555-0202", points: 35, visits: 3, spend: "35.50", tierId: buddyTierId, qr: "token_clotile_bayou_88" },
            { firstName: "Alphonse", lastName: "Robichaux", email: "alphonse@smokehouse.com", phone: "713-555-0303", points: 62, visits: 5, spend: "68.20", tierId: regularTierId, qr: "token_alphonse_regular_77" },
            { firstName: "Evangeline", lastName: "Arceneaux", email: "evangeline@gumbo.com", phone: "281-555-0404", points: 180, visits: 16, spend: "162.45", tierId: goldTierId, qr: "token_evangeline_gold_66" },
            { firstName: "Remy", lastName: "Lebeau", email: "remy@boss.com", phone: "832-555-0505", points: 340, visits: 22, spend: "245.90", tierId: bossTierId, qr: "token_remy_boss_55" }
        ];
        for (const c of demoCustomers) {
            // Insert customer
            const custResult = await index_1.db.insert(schema_1.customers).values({
                publicId: `cust-uuid-${c.firstName.toLowerCase()}`,
                firstName: c.firstName,
                lastName: c.lastName,
                email: c.email,
                phone: c.phone,
                consentPromotions: true,
                status: "active"
            });
            // Fetch the created customer
            const newCusts = await index_1.db.select().from(schema_1.customers).where((0, drizzle_orm_1.eq)(schema_1.customers.email, c.email));
            const newCust = newCusts[0];
            // Generate random account number
            const rewardsNumber = "BCR-" + Math.floor(100000 + Math.random() * 900000);
            // Create loyalty account
            await index_1.db.insert(schema_1.loyaltyAccounts).values({
                customerId: newCust.id,
                rewardsNumber,
                publicQrToken: c.qr,
                barcodeValue: "BAR-" + rewardsNumber,
                pointsBalance: c.points,
                lifetimePoints: c.points + 20, // Add 20 spent points for realism
                totalVisits: c.visits,
                lifetimeSpend: c.spend,
                currentTierId: c.tierId
            });
            const newLoyalties = await index_1.db.select().from(schema_1.loyaltyAccounts).where((0, drizzle_orm_1.eq)(schema_1.loyaltyAccounts.customerId, newCust.id));
            const loyaltyAcc = newLoyalties[0];
            // Add points ledger records and visit history for realism
            if (c.visits > 0) {
                console.log(`Adding realistic visit history for ${c.firstName}...`);
                // Let's log visits
                for (let i = 1; i <= c.visits; i++) {
                    const vDate = new Date();
                    vDate.setDate(today.getDate() - (c.visits - i) * 3 - 2); // Spread them in the past
                    const visitPoints = 10; // Default points per visit
                    await index_1.db.insert(schema_1.visits).values({
                        customerId: newCust.id,
                        loyaltyAccountId: loyaltyAcc.id,
                        staffUserId: 3, // Clint Team Member
                        source: "tablet",
                        visitDate: vDate,
                        pointsAwarded: visitPoints,
                        duplicateOverride: false
                    });
                    await index_1.db.insert(schema_1.pointsLedger).values({
                        customerId: newCust.id,
                        loyaltyAccountId: loyaltyAcc.id,
                        staffUserId: 3,
                        type: "earn_visit",
                        pointsChange: visitPoints,
                        balanceAfter: visitPoints * i,
                        reason: `Earned points for visit #${i}`,
                        source: "tablet",
                        createdAt: new Date(vDate)
                    });
                }
            }
        }
        // 10. Seed System Settings
        console.log("Seeding system configuration settings...");
        const systemSettings = [
            { key: "points_per_visit", value: "10", description: "Default points awarded per shop check-in/visit" },
            { key: "points_per_dollar", value: "1", description: "Loyalty points awarded per dollar spent" },
            { key: "max_visits_per_day", value: "1", description: "Maximum loyalty visits allowed per customer per day" },
            { key: "allow_same_day_duplicate_visits", value: "false", description: "Can a customer log multiple visits on the same day? (true/false)" },
            { key: "min_purchase_amount_to_count_visit", value: "5.00", description: "Minimum receipt total (in USD) to count as a qualified loyalty visit" },
            { key: "high_value_reward_threshold", value: "300", description: "Redemptions above this points value require manager override/approval" },
            { key: "max_manual_points_per_team_shift", value: "100", description: "Maximum points a team member can manually adjust in a single shift" },
            { key: "require_reason_for_manual_adjust", value: "true", description: "Require staff to enter a text reason for manual points changes" },
            { key: "receipt_claim_review_threshold", value: "50.00", description: "Receipt claims larger than this amount are placed in review" },
            { key: "enable_spend_tracking", value: "true", description: "Enable lifetime spend calculation" },
            { key: "enable_visit_tracking", value: "true", description: "Enable loyalty visits accumulation" },
            { key: "enable_points_tracking", value: "true", description: "Enable general rewards points balances" }
        ];
        for (const s of systemSettings) {
            await index_1.db.insert(schema_1.settings).values(s);
        }
        console.log("Database seeded successfully! Let's eat some Boudin!");
        await index_1.pool.end();
        process.exit(0);
    }
    catch (error) {
        console.error("Seeding failed:", error);
        await index_1.pool.end();
        process.exit(1);
    }
}
main();
