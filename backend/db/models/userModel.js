const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { DataTypes, Model } = require("sequelize");

const parseList = (value) => {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

class User extends Model {
  comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  }

  getResetPasswordToken() {
    const resetToken = crypto.randomBytes(20).toString("hex");
    this.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    this.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);
    return resetToken;
  }
}

function initUserModel(sequelize) {
  User.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      fullName: { type: DataTypes.STRING, allowNull: false },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        set(value) {
          this.setDataValue("email", String(value).trim().toLowerCase());
        },
      },
      password: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
      role: {
        type: DataTypes.ENUM("student", "faculty", "admin"),
        allowNull: false,
      },
      phone: DataTypes.STRING,
      department: { type: DataTypes.STRING, allowNull: false },
      rollNumber: DataTypes.STRING,
      year: DataTypes.STRING,
      researchDomain: DataTypes.STRING,
      supervisor: DataTypes.STRING,
      designation: DataTypes.STRING,
      facultyId: DataTypes.STRING,
      googleId: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
      resetPasswordToken: DataTypes.STRING,
      resetPasswordExpire: DataTypes.DATE,
      notifications: {
        type: DataTypes.TEXT("long"),
        get() {
          return parseList(this.getDataValue("notifications"));
        },
        set(value) {
          this.setDataValue("notifications", JSON.stringify(Array.isArray(value) ? value : []));
        },
      },
      avatar: { type: DataTypes.STRING, defaultValue: "" },
    },
    {
      sequelize,
      modelName: "User",
      defaultScope: {
        attributes: { exclude: ["password", "resetPasswordToken"] },
      },
      scopes: {
        withPassword: {
          attributes: { include: ["password", "resetPasswordToken", "resetPasswordExpire"] },
        },
      },
      hooks: {
        async beforeCreate(user) {
          if (user.password) {
            user.password = await bcrypt.hash(user.password, 12);
          }
        },
        async beforeUpdate(user) {
          if (user.changed("password") && user.password) {
            user.password = await bcrypt.hash(user.password, 12);
          }
        },
      },
    }
  );

  return User;
}

module.exports = { User, initUserModel };
