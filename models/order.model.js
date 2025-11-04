import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: String, // snapshot
    price: Number, // snapshot
    quantity: { type: Number, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],

    // Embedded address snapshot
    shippingAddress: {
      name: String,
      mobileNo: String,
      address: String,
      locality: String,
      city: String,
      state: String,
      pincode: String,
      landmark: String,
    },

    subtotal: Number,
    discount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

    paymentMethod: {
      type: String,
      enum: ["COD", "RAZORPAY", "STRIPE", "PAYPAL"],
      default: "COD",
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
    shipment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shipment",
    },

    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "delivered", "cancelled"],
      default: "pending",
    },

    paidAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
  },
  { timestamps: true }
);

// Helpful indexes
// orderSchema.index({ user: 1 });
// orderSchema.index({ status: 1 });
// orderSchema.index({ createdAt: -1 });

export default mongoose.model("Order", orderSchema);
