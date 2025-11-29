import Order from "../models/order.model.js";
import logger from "../config/logger.js";


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

}

// get order by ID
export const getOrderById = async(req, res) => {

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