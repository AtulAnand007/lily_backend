import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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
      // Regex validation
      match: [
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).+$/,
        "Password must include at least one uppercase letter, one lowercase letter, one number, and one special character",
      ],
      // Not required for Google users
      select: false,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    // For Google login
    googleId: { type: String, default: null },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
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

    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },
    profileImage: {
      type: String,
      default: "https://via.placeholder.com/150",
    },
    profileImagePublicId: {
      type: String,
      default: "",
    },

    refreshToken: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (this.authProvider === "google") {
    this.password = undefined; // ensure no password is stored for google login
    return next();
  }
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false; // Google users may not have password
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.statics.findOrCreateGoogleUser = async function (profile) {
  const existingUser = await this.findOne({ email: profile.email });

  if (existingUser) {
    if (
      existingUser.authProvider === "local" &&
      !existingUser.googleId &&
      profile.googleId
    ) {
      throw new Error(
        "Account already exists with this email. Try logging in instead."
      );
    }
    return existingUser;
  }

  const newUser = await this.create({
    fullName: profile.name,
    email: profile.email,
    googleId: profile.googleId,
    authProvider: "google",
    isVerified: true,
    password: undefined,
  });

  return newUser;
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.__v;
  return obj;
};

const User = mongoose.model("User", userSchema);
export default User;
