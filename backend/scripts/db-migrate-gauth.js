const { DataTypes } = require("sequelize");
const { connectDB, closeDB, sequelize } = require("../config/db");

const USER_TABLE = "User";
const GOOGLE_ID_INDEX = "user_google_id_unique";

async function ensureNullablePassword(queryInterface, table) {
  if (!table.password) {
    throw new Error(`Table ${USER_TABLE} is missing required password column.`);
  }

  await queryInterface.changeColumn(USER_TABLE, "password", {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: null,
  });
}

async function ensureGoogleIdColumn(queryInterface, table) {
  if (table.google_id) {
    return;
  }

  await queryInterface.addColumn(USER_TABLE, "google_id", {
    type: DataTypes.STRING,
    allowNull: true,
  });
}

async function ensureGoogleIdIndex(queryInterface) {
  const indexes = await queryInterface.showIndex(USER_TABLE);
  const hasUniqueGoogleIdIndex = indexes.some((index) => {
    if (!index.unique) return false;
    return index.fields?.some((field) => field.attribute === "google_id");
  });

  if (!hasUniqueGoogleIdIndex) {
    await queryInterface.addIndex(USER_TABLE, ["google_id"], {
      name: GOOGLE_ID_INDEX,
      unique: true,
    });
  }
}

async function run() {
  try {
    await connectDB();
    const queryInterface = sequelize.getQueryInterface();
    const table = await queryInterface.describeTable(USER_TABLE);

    await ensureNullablePassword(queryInterface, table);
    await ensureGoogleIdColumn(queryInterface, table);
    await ensureGoogleIdIndex(queryInterface);

    console.log("Google auth database migration completed.");
  } catch (error) {
    console.error("Google auth database migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    await closeDB();
  }
}

run();
