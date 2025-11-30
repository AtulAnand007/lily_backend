import Order from "../models/order.model.js";
import logger from "../config/logger.js";
import mongoose from "mongoose";


// get all order admin only
export const getAllOrders = async(req, res) => {
    try {

        if (req.user.role !== "ADMIN") {
            res.status(403).json({ message: "Invalid user" });
        }

        const orders = await Order.find().populate("user", "fullName  email").sort({ createdAt: -1 });

        logger.info('Order fetched successfully');

        return res.status(200).json({
            success: true,
            orders
        });


    } catch (error) {
        logger.error("Failed to fetched all orders", {
            message: error.message
        })

        return res.status(500).json({ message: "Internal server error" });

    }
}

// get all user orders -- for specific User only
export const getUserOrders = async(req, res) => {
    try {
        const userId = req.user._id;

        const orders = await Order.find({ user: userId })
            .sort({ createdAt: -1 })
            .lean();

        logger.info(`User orders fetched successfully for ${userId}`);

        return res.status(200).json({
            success: true,
            orders,
            count: orders.length,
            message: "User orders fetched successfully"
        });

    } catch (error) {
        logger.error("Get user orders failed", { message: error.message });
        return res.status(500).json({ message: "Internal server error" });
    }
};


// get order by ID
export const getOrderById = async(req, res) => {
    try {

        const orderId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: "Invalid order ID" });
        }
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order does not exist" });
        }

        return res.status(200).json({
            success: true,
            order,
            message: "Order fetched successfully"
        })

    } catch (error) {
        logger.error("Order fetched by id failed", { message: error.message });
        return res.status(500).json({ message: "Internal Server error" });
    }
}

// create order 
export const createOrder = async(req, res) => {

}

// cancel order 
export const cancelOrder = async(req, res) => {

}

// update order status -- Admin Only
export const updateOderStatus = async(req, res) => {

}