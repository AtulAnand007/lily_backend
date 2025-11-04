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

}, {timestamps: true})

const Shipment = mongoose.model("Shipment", shipmentSchema);
export default Shipment;