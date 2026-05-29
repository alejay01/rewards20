import dotenv from "dotenv";
dotenv.config({ override: true });

import { app } from "./app";

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
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
