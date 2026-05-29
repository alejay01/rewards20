"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("mysql2/promise"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
async function main() {
    console.log("Dropping local rewards20 database for clean schema rebuild...");
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
        await connection.query(`DROP DATABASE IF EXISTS \`${database}\`;`);
        console.log(`Database '${database}' dropped successfully!`);
        await connection.query(`CREATE DATABASE \`${database}\`;`);
        console.log(`Database '${database}' recreated fresh!`);
        await connection.end();
        process.exit(0);
    }
    catch (error) {
        console.error("Failed to drop database:", error.message);
        process.exit(1);
    }
}
main();
