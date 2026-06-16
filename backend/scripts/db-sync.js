const { connectDB, closeDB, syncDatabase } = require("../config/db");

async function run() {
  try {
    await connectDB();
    await syncDatabase();
    console.log("Database schema synchronized.");
    await closeDB();
  } catch (error) {
    console.error("Database sync failed:", error.message);
    process.exit(1);
  }
}

run();
