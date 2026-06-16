"use strict";

const http = require("http");
const { Server } = require("socket.io");
const app = require("./server");
const { env } = require("./config/env");
const { connectDB, syncDatabase } = require("./config/db");

async function startServer() {
  await connectDB();
  await syncDatabase();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: env.ALLOWED_ORIGINS,
      credentials: true,
    },
  });

  app.set("io", io);

  server.listen(env.PORT, () => {
    console.log(`✅ Backend + Socket.IO running on http://localhost:${env.PORT}`);
  });

  return server;
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error("Failed to start backend server:", error);
    process.exit(1);
  });
}

module.exports = { startServer };
