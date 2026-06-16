const { connectDB, closeDB, syncDatabase } = require("../config/db");

async function run() {
  try {
    await connectDB();
    await syncDatabase({ force: true });
    console.log("Database schema reset.");
    await closeDB();
  } catch (error) {
    console.error("Database reset failed:", error.message);
    process.exit(1);
  }
}

run();
