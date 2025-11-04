import mongoose from "mongoose";

const shipmentSchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },
    carrier: {
        type: String
    },
    trackingNumber: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'in_transit', 'delivered', 'failed'],
        default: 'pending'
    },
    estimatedDelivery: { type: Date },
    shippedAt: { type: Date },
    deliveredAt: { type: Date },

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

    providerData: {
      apiProvider: String,
      trackingUrl: String,
      rawResponse: mongoose.Schema.Types.Mixed,
    },

}, {timestamps: true})

const Shipment = mongoose.model("Shipment", shipmentSchema);
export default Shipment;