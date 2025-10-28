import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },

    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters long"],
      // Not required for Google users
      select: false,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    otp: {
      type: String,
    },

    otpExpires: {
      type: Date,
    },

    googleId: {
      type: String,
      default: null,
    },

    addresses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address",
      },
    ],

    cart: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
    },

    orderHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
      },
    ],

    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

//
// 🔐 PASSWORD HASHING (Pre-save middleware)
//
userSchema.pre("save", async function (next) {
  // Hash only if password is new or modified
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

//
// 🔍 INSTANCE METHOD: Compare password
//
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false; // Google users may not have password
  return await bcrypt.compare(candidatePassword, this.password);
};

//
// 🔑 INSTANCE METHOD: Generate Access Token (JWT)
//
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      fullName: this.fullName,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" } // e.g. 15 minutes
  );
};

//
// ♻️ INSTANCE METHOD: Generate Refresh Token
//
userSchema.methods.generateRefreshToken = function () {
  const token = jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" } // e.g. 7 days
  );
  this.refreshToken = token; // Save it in DB for revocation if needed
  return token;
};

//
// 🧾 INSTANCE METHOD: Generate OTP
//
userSchema.methods.generateOTP = function () {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
  this.otp = otp;
  this.otpExpires = Date.now() + 10 * 60 * 1000; // valid for 10 minutes
  return otp;
};

//
// 🧹 INSTANCE METHOD: Clear OTP
//
userSchema.methods.clearOTP = function () {
  this.otp = undefined;
  this.otpExpires = undefined;
};

//
// 🧠 STATIC METHOD: Find or create Google user
//
userSchema.statics.findOrCreateGoogleUser = async function (profile) {
  const existingUser = await this.findOne({ email: profile.email });

  if (existingUser) return existingUser;

  const newUser = await this.create({
    fullName: profile.name,
    email: profile.email,
    googleId: profile.googleId,
    isVerified: true,
  });

  return newUser;
};

//
// 🔒 SECURITY: Remove sensitive fields in JSON responses
//
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  delete obj.otpExpires;
  delete obj.refreshToken;
  delete obj.__v;
  return obj;
};

//
// 🚀 EXPORT MODEL
//
const User = mongoose.model("User", userSchema);
export default User;
