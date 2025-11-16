import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category", // self-reference for subcategories
      default: null,
      validate: {
        validator: function (value) {
          if (!value) return true; // prevent self reference
          return !value.equal(this._id);
        },
        message: "Category cannot be its own parent",
      },
    },
    image: {
      url: { type: String },
      public_id: { type: String },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Category", categorySchema);
