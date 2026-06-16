const { User } = require("./db/models");
const { connectForScript } = require("./utils/scriptSafety");

async function cleanup() {
  try {
    await connectForScript("cleanup");
    const [count] = await User.update(
      { rollNumber: null, year: null },
      { where: { role: "faculty" } }
    );
    console.log(`Cleanup complete. Modified ${count} faculty records.`);
    process.exit(0);
  } catch (error) {
    console.error("Error during cleanup:", error);
    process.exit(1);
  }
}

cleanup();
