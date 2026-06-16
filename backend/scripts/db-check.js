const { connectDB, closeDB } = require("../config/db");

async function run() {
  try {
    await connectDB();
    console.log("MySQL connection successful.");
    await closeDB();
  } catch (error) {
    console.error("MySQL connection failed:", error.message);
    process.exit(1);
  }
}

run();
