import fs from "fs";
import path from "path";

const schemaPath = path.resolve(__dirname, "../db/schema.ts");

console.log("Fixing serial fields in schema.ts for MariaDB/MySQL compatibility...");

try {
  let content = fs.readFileSync(schemaPath, "utf8");
  
  // Replace serial("id").primaryKey() with int("id").autoincrement().primaryKey()
  const replaced = content.replace(/serial\("id"\)\.primaryKey\(\)/g, "int(\"id\").autoincrement().primaryKey()");
  
  fs.writeFileSync(schemaPath, replaced, "utf8");
  console.log("schema.ts successfully corrected to use int autoincrement primary keys!");
  process.exit(0);
} catch (error: any) {
  console.error("Failed to fix schema.ts:", error.message);
  process.exit(1);
}
