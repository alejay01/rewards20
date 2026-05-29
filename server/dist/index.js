"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = require("./app");
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
const server = app_1.app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`   Boudin Boss Rewards MVP Server is running!`);
    console.log(`   Port: http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`===============================================`);
});
// Handle graceful termination
const gracefulShutdown = () => {
    console.log("Shutting down server gracefully...");
    server.close(() => {
        console.log("Server closed.");
        process.exit(0);
    });
};
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
