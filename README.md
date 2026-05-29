# The Boudin Company Rewards — Boudin Boss Rewards MVP

Welcome to the official source code for **Boudin Boss Rewards**, a complete, mobile-first, and tablet-friendly PWA loyalty and rewards MVP built exclusively for **The Boudin Company** in Rosenberg, Texas.

This rewards platform is designed to function 100% independently using a high-performance **Node.js/Express** backend, **React with TypeScript & Tailwind CSS** frontend, and a **MySQL** production database. It features a dedicated landscape counter tablet mode for cashiers, customer dashboards with gamified progress bars, unique cryptographically random QR check-ins, offline PWA caching, receipt Missed-Points claim systems, and an asynchronous Loyverse API sync layer.

---

## 🍽️ Technical Architecture

This application uses a **Monolithic Single-Port Architecture** specifically optimized for shared hosting environments. The Express backend handles REST API routes under `/api/*` and serving static client files for everything else, making deployment extremely simple and robust.

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + React Router + PWA Service Worker + HTML5 camera QR code scanner.
- **Backend**: Node.js + Express + TypeScript (compiled to production-ready standard ES6).
- **ORM & Driver**: Drizzle ORM + pure-JS `mysql2` driver (Zero-Binary dependencies; prevents binary execution errors on shared hosts).
- **Security & RBAC**: Granular database-mapped roles (Administrator, Manager, Team Member), secure password hashing (bcryptjs), rate limiting, and Helmet headers.
- **Fraud Prevention**: Random 32-byte public QR tokens (no database keys exposed), daily visit limit rules, manager PIN code overrides, high-receipt verification thresholds, and complete audit tracking logs.

---

## 🚀 Quick Start — Local Development

### 1. Prerequisites
- **Node.js** (v18.x or v20.x recommended)
- **Local MySQL Server** (e.g. running via **XAMPP**, WampServer, or standard install on port `3306`)

### 2. Configure Environment Variables
Copy `.env.example` to `.env` in the root and configure your local XAMPP MySQL database details:
```bash
cp .env.example .env
```
*(A default `.env` is already pre-configured for local blank-password XAMPP MySQL on `127.0.0.1:3306` with database name `rewards20`).*

### 3. Install All Dependencies
Run the unified installer script from the root directory:
```bash
npm run install:all
```
This automatically runs `npm install` inside the root, the `/client` directory, and the `/server` directory.

### 4. Create and Migrate Database
Run the unified database verification and migration command:
```bash
npm run db:migrate
```
*What this does under the hood:*
1. Connects to your local MySQL and auto-creates the schema `rewards20` if it does not exist yet.
2. Compiles Drizzle Kit migration SQL files.
3. Automatically executes database tables, constraints, and indexes setup.

### 5. Seed Demo Cajun Data
Populate roles, permissions, staff accounts, rewards milestones, specials campaigns, and demo members:
```bash
npm run db:seed
```

### 6. Run the Project
Launch both Vite React developer client and Express API server concurrently:
```bash
npm run dev
```
Open **http://localhost:5173** to view the customer landing page and sign up!  
Open **http://localhost:3000/health** to verify the Express server is connected to MySQL and running correctly.

---

## 🧑‍🍳 Seeded Demo Logins & Access

Use these credentials to test role-based access control inside the **Staff Portal** (`/staff/login`):

| Role | Username / Email | Password | Override PIN |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@theboudincompany.com` | `BoudinBoss2026!` | `1234` |
| **Manager** | `manager@theboudincompany.com` | `BoudinBoss2026!` | `1234` |
| **Team Member** | `team@theboudincompany.com` | `BoudinBoss2026!` | None |

### Seeded Cajun Customers (Testing Tokens)
Copy-paste these QR check-in tokens directly in **Counter Tablet Mode** (`/tablet`) to test lookup and check-in overrides:
- `token_remy_boss_55` — **Remy Lebeau** (Boudin Boss Tier, 340 PTS, 22 Visits)
- `token_clotile_bayou_88` — **Clotile Hebert** (Bayou Buddy Tier, 35 PTS, 3 Visits)
- `token_alphonse_regular_77` — **Alphonse Robichaux** (Boudin Regular Tier, 62 PTS)

---

## ☁️ Deploying on Hostinger Web Hosting — Non-VPS Only

Hostinger's shared web hosting supports Node.js applications natively through **hPanel** without requiring a virtual private server (VPS). This guide details the complete deployment process step-by-step.

### ⚠️ Critical Constraints
> [!IMPORTANT]
> **No Docker or Root Daemons**: Hostinger shared hosting runs inside a shared Passenger environment. You **cannot** use Docker containerizing, PostgreSQL native system installations, MongoDB daemon services, Redis servers, PM2 background creation scripts, or systemctl Linux commands. This codebase is fully engineered to run as a **single-process Express monolithic app** which avoids all these limitations!

---

### Step 1: Create a MySQL Database in Hostinger
1. Log in to your Hostinger hPanel.
2. Search for and click **MySQL Databases**.
3. Under *Create a New MySQL Database*, enter:
   - **Database Name**: e.g., `u123456789_rewards`
   - **Username**: e.g., `u123456789_boudin`
   - **Password**: e.g., `BoudinBossHostinger2026!`
4. Click **Create**.
5. Keep hPanel open. Note down the **MySQL Host** (which usually looks like `mysql.hostinger.com` or `127.0.0.1` rather than standard `localhost`).

---

### Step 2: Build the Production Bundle Locally
Hostinger shared hosting usually has lower RAM and CPU quotas for builds. To prevent timeouts, compile the frontend and backend locally before uploading!

1. Open your local terminal in the root of the project.
2. Compile and package the entire bundle:
   ```bash
   npm run build
   ```
   *What this does:*
   - React compiles the Vite TS code and builds static resources into `/server/public/`.
   - The Express TypeScript code compiles into raw production-ready JavaScript in `/server/dist/`.
   - Copies visual asset placeholders into their correct folders.

---

### Step 3: Package Upload Files
Prepare a single `.zip` file of the server directory to upload:
1. Open the `/server/` directory on your machine.
2. Zip the following files and folders:
   - `/dist/` (contains server compiled code and frontend static resources)
   - `/migrations/` (contains SQL database migration files)
   - `package.json`
   - `package-lock.json`
   - `.env.example`
3. Name this archive `boudin-rewards-deploy.zip`.  
*(Do **NOT** zip the `node_modules` folder. Hostinger will install these natively to match the server operating system!)*

---

### Step 4: Upload via Hostinger hPanel File Manager
1. In hPanel, go to **Websites** -> click **Manage** -> open **File Manager**.
2. Locate or create a folder for your Node.js application (e.g. `/domains/theboudincompany.com/rewards`).
3. Click **Upload File** and select your zipped archive `boudin-rewards-deploy.zip`.
4. Right-click the uploaded file and select **Extract** to unpack everything into this folder.

---

### Step 5: Initialize the Node.js Application in hPanel
1. Search hPanel for **Node.js** and click it.
2. Click **Create Application**.
3. Fill out the application settings fields:
   - **Node.js Version**: Select `18.x` or `20.x` (matching your local environment).
   - **Application URL**: Select your subdomain or main domain (e.g., `https://theboudincompany.com`).
   - **Application Directory**: Specify the directory path where you extracted the files (e.g., `/domains/theboudincompany.com/rewards`).
   - **Application Entry File**: Set this strictly to `dist/index.js` (this represents our compiled Express entry point!).
4. Click **Create**.

---

### Step 6: Configure Hostinger hPanel Environment Variables
Inside your newly created Node.js hPanel app view, scroll to **Environment Variables** and enter:
- `NODE_ENV` = `production`
- `PORT` = `3000` (Passenger will automatically bind this dynamically to Hostinger's webserver port)
- `DATABASE_URL` = `mysql://u123456789_boudin:BoudinBossHostinger2026!@mysql.hostinger.com:3306/u123456789_rewards`
- `MYSQL_HOST` = `mysql.hostinger.com`
- `MYSQL_PORT` = `3306`
- `MYSQL_DATABASE` = `u123456789_rewards`
- `MYSQL_USER` = `u123456789_boudin`
- `MYSQL_PASSWORD` = `BoudinBossHostinger2026!`
- `JWT_SECRET` = `boudin-boss-rewards-secret-key-2026!`
- `SESSION_SECRET` = `boudin-boss-rewards-session-secret-key-2026!`
- `QR_TOKEN_SECRET` = `boudin-boss-rewards-qr-cryptography-key-2026!`
- `LOYVERSE_DEMO_MODE` = `true` (keeps integration layer safe in sandbox mode)

Click **Save** or **Apply**.

---

### Step 7: Run Migrations & Seed Data on Hostinger
To run database schema migrations and insert seed records on the Hostinger server, you can execute standard npm scripts:

1. Under the hPanel Node.js dashboard, locate **Run NPM Command** (or open the browser-integrated Web SSH Terminal in hPanel).
2. Run standard installation to set up server dependencies:
   ```bash
   npm install --production
   ```
3. Execute the database migration runner to initialize tables, indexes, and keys:
   ```bash
   npm run db:migrate
   ```
4. Execute the Cajun seed command to load standard tiers, rewards, roles, and demo customer accounts:
   ```bash
   npm run db:seed
   ```

---

### Step 8: Start the Application & Verify
1. Scroll to the top of the Hostinger hPanel Node.js dashboard.
2. Click **Start App** (or **Restart App** if it was active).
3. Open a browser and visit your configured URL:
   - **`https://theboudincompany.com/health`** -> Verify status is `ok` and `dbConnection` is active!
   - **`https://theboudincompany.com/version`** -> Displays release version `1.0.0`.
   - **`https://theboudincompany.com/`** -> View your beautifully customized customer rewards dashboard!

---

## 🎨 Design Customization Guide

If you wish to change visual asset placeholders (visual photos, banners, and logos):
1. Prepare high-resolution PNG or JPG assets with matching filenames.
2. Open the hPanel File Manager.
3. Replace the placeholder files located inside **`dist/public/assets/`** with your new visual assets:
   - `tbc-logo.png` (Company branding logo)
   - `restaurant-front.jpg` (Landing banner)
   - `boudin-balls.jpg` (Food photography item)
   - `boudin-links.jpg` (Food photography item)
   - `tea-cakes.jpg` (Food photography item)
   - `badge-rookie-roller.png` to `badge-vip-smokehouse-legend.png` (Visual tier medals)

---

## 🛠️ Verification & Troubleshooting

### Database Connection Failure
- **Error**: `ECONNREFUSED` or `Unknown database...`
- **Solution**: Confirm that your `MYSQL_HOST` in hPanel matches the exact address listed under Hostinger Databases, and that your hPanel user is linked with `All Privileges` to the database schema.

### Hostinger App Restarts Constantly
- **Error**: App crashes or displays `Passenger error page`.
- **Solution**: Check that the Application Entry File is set exactly to `dist/index.js` and that `npm install` ran successfully without compiling errors. You can inspect runtime console outputs by downloading the Passenger logs in File Manager (located under `logs/` or `.passenger.log`).
