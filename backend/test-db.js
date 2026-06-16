const { connectDB, closeDB } = require("./config/db");

async function test() {
  try {
    console.log("Connecting...");
    await connectDB();
    console.log("✅ SUCCESS");
    await closeDB();
    process.exit(0);
  } catch (error) {
    console.error("❌ FAILED:", error.message);
    process.exit(1);
  }
}

test();
