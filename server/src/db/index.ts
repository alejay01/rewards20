import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";
import dotenv from "dotenv";

dotenv.config();

const connectionUri = process.env.DATABASE_URL;

let pool: mysql.Pool;

if (connectionUri) {
  // Use connection URI but also ensure keepalive settings are merged if possible, or create pool with options
  pool = mysql.createPool({
    uri: connectionUri,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
  });
} else {
  pool = mysql.createPool({
    host: process.env.MYSQL_HOST || "127.0.0.1",
    port: parseInt(process.env.MYSQL_PORT || "3306"),
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "rewards20",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000
  });
}

// Prevent pool connection socket errors or idle timeouts from crashing the server process
(pool as any).on("error", (err: any) => {
  console.error("Database connection pool encountered an error:", err);
});

export const db = drizzle(pool, { schema, mode: "default" });
export { pool };
export default db;
