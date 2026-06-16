const { env, validateEnv } = require("../config/env");
const { connectDB } = require("../config/db");

function ensureSafeScriptEnvironment(scriptName) {
  validateEnv();

  if (env.NODE_ENV === "production") {
    throw new Error(`${scriptName} is blocked in production.`);
  }
}

async function connectForScript(scriptName) {
  ensureSafeScriptEnvironment(scriptName);
  await connectDB();
}

module.exports = { connectForScript, ensureSafeScriptEnvironment };
