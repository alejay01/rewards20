"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function main() {
    console.log("Checking local database environment...");
    const host = process.env.MYSQL_HOST || "127.0.0.1";
    const port = parseInt(process.env.MYSQL_PORT || "3306");
    const user = process.env.MYSQL_USER || "root";
    const password = process.env.MYSQL_PASSWORD || "";
    const database = process.env.MYSQL_DATABASE || "rewards20";
    try {
        const connection = await promise_1.default.createConnection({
            host,
            port,
            user,
            password
        });
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
        console.log(`Database '${database}' verified/created successfully!`);
        await connection.end();
        process.exit(0);
    }
    catch (error) {
        console.warn("Could not auto-create database (using connection URL or offline). Attempting raw pool connection next...");
        process.exit(0); // Fail-silent to allow standard Drizzle migrate to run directly if already created or using single URL
    }
}
main();
