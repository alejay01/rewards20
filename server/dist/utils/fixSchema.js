"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const schemaPath = path_1.default.resolve(__dirname, "../db/schema.ts");
console.log("Fixing serial fields in schema.ts for MariaDB/MySQL compatibility...");
try {
    let content = fs_1.default.readFileSync(schemaPath, "utf8");
    // Replace serial("id").primaryKey() with int("id").autoincrement().primaryKey()
    const replaced = content.replace(/serial\("id"\)\.primaryKey\(\)/g, "int(\"id\").autoincrement().primaryKey()");
    fs_1.default.writeFileSync(schemaPath, replaced, "utf8");
    console.log("schema.ts successfully corrected to use int autoincrement primary keys!");
    process.exit(0);
}
catch (error) {
    console.error("Failed to fix schema.ts:", error.message);
    process.exit(1);
}
