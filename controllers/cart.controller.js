import Product from "../models/product.model.js";
import Cart from "../models/cart.model.js";
import logger from "../config/logger.js";
import getPopulatedCart from "../utils/aggregationFns/cartAggregation.js";

// helper function -- to refresh cart
export const refreshCartPrices = async (cart) => {
  if (!cart || !cart.items || cart.items.length === 0) return cart;

  const productIds = cart.items.map((i) => i.product);

  const products = await Product.find({
    _id: { $in: productIds },
    isActive: true, // Only allow active products
  }).select("_id price stock isActive");

  const map = new Map(products.map((p) => [p._id.toString(), p]));

  // Filter + update price + remove invalid products
  cart.items = cart.items
    .map((item) => {
      const product = map.get(item.product.toString());

      // 🔥 If product does not exist or inactive → remove from cart
      if (!product) return null;

      return {
        product: item.product,
        quantity: Math.min(item.quantity, product.stock), // auto-fix excessive quantity
        price: product.price, // always update to latest
      };
    })
    .filter(Boolean); // remove null entries

  return cart;
};

// all these operations are for User only
export const getCart = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    // 1️⃣ Fetch raw cart (not aggregated) to update prices
    let rawCart = await Cart.findOne({ user: user._id });
    if (!rawCart) {
      return res.status(200).json({
        success: true,
        message: "Cart is empty",
        data: { items: [], totalItems: 0, totalPrice: 0 },
      });
    }

    // 2️⃣ Auto-refresh cart prices (Option C)
    rawCart = await refreshCartPrices(rawCart);
    await rawCart.save();

    // 3️⃣ Fetch aggregated cart (products populated, totals calculated)
    const cart = await getPopulatedCart(user._id);

    logger.info(`Cart details fetched for user: ${user._id}`);
    return res.status(200).json({
      success: true,
      message: "Cart details fetched successfully",
      data: cart,
    });
  } catch (error) {
    logger.error(
      `Internal Server Error while fetching Cart Details: ${error.message}`
    );
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while fetching Cart Details",
    });
  }
};

export const addToCart = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    const { productId, quantity = 1 } = req.body;
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    if (!product.isActive) {
      return res.status(400).json({
        success: false,
        message: "Product is inActive",
      });
    }
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,

        message: "Insufficient stock",
      });
    }

    let cart = await Cart.findOne({ user: user._id });
    // if cart does not exist create a new one
    if (!cart) {
      cart = await Cart.create({
        user: user._id,
        items: [
          {
            product: product._id,
            quantity,
            price: product.price, // initial snapshot
          },
        ],
      });
    } else {
      // check if product already in cart -- increment quantity
      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === product._id.toString()
      );
      if (itemIndex > -1) {
        // update quantity
        cart.items[itemIndex].quantity += quantity;

        if (cart.items[itemIndex].quantity > product.stock) {
          return res.status(400).json({
            success: false,
            message: "Stock limit exceeded",
          });
        }
      } else {
        // add new product
        cart.items.push({
          product: product._id,
          quantity,
          price: product.price, // initial snapshot
        });
      }

      cart = await refreshCartPrices(cart);
      await cart.save();
    }
    // return populated cart
    const updatedCart = await getPopulatedCart(user._id);
    return res.status(200).json({
      success: true,
      message: "Product added to cart successfully",
      data: updatedCart,
    });
  } catch (error) {
    logger.error(`Add to cart error: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while adding item to cart",
    });
  }
};

// only able to update quantity
export const updateCartItem = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    const { productId, quantity } = req.body;
    if (!productId || quantity == null) {
      return res.status(400).json({
        success: false,
        message: "Product ID and quantity are required",
      });
    }
    const qty = Number(quantity);
    if (Number.isNaN(qty) || qty < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer (>= 1)",
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    if (!product.isActive) {
      return res.status(400).json({
        success: false,
        message: "Product is inactive",
      });
    }
    if (product.stock < qty) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
      });
    }

    const cart = await Cart.findOne({ user: user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const itemIndex = cart.items.findIndex(
      (i) => i.product.toString() == productId
    );
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Product not in cart",
      });
    }
    cart.items[itemIndex].quantity = qty; // numeric value
    cart.items[itemIndex].price = product.price; // snap

    await cart.save();
    const updatedCart = await getPopulatedCart(user._id);

    return res.status(200).json({
      success: true,
      message: "Cart item updated",
      data: updatedCart,
    });
  } catch (error) {
    logger.error("updateCartItem Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while updating cart item",
    });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required",
      });
    }

    const cart = await Cart.findOne({ user: user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const beforeCount = cart.items.length;

    // remove item
    cart.items = cart.items.filter((i) => i.product.toString() !== productId);

    const afterCount = cart.items.length;
    // product not found inside cart
    if (beforeCount === afterCount) {
      return res.status(404).json({
        success: false,
        message: "Product not found in cart",
      });
    }
    // If cart becomes empty, delete it
    if (cart.items.length === 0) {
      await Cart.deleteOne({ user: user._id });

      return res.status(200).json({
        success: true,
        message: "Item removed, cart is now empty",
        data: { items: [], totalItems: 0, totalPrice: 0 },
      });
    }

    await cart.save();
    const updatedCart = await getPopulatedCart(user._id);

    return res.status(200).json({
      success: true,
      message: "Item removed from cart",
      data: updatedCart,
    });
  } catch (error) {
    logger.error("removeFromCart Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while removing from cart",
    });
  }
};

export const clearCart = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const cart = await Cart.findOne({ user: user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }
    // Delete the cart entirely (recommended)
    await Cart.deleteOne({ user: user._id });

    return res.status(200).json({
      success: true,
      message: "Cart cleared",
      data: { items: [], totalItems: 0, totalPrice: 0 },
    });
  } catch (error) {
    logger.error("clearCart Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error while clearing cart",
    });
  }
};

export const moveCartToOrder = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const cart = await Cart.findOne({ user: user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }
    // 2️⃣ Auto-update cart prices (Option C)
    cart = await refreshCartPrices(cart);
    await cart.save();

    // validate stock again before placing order
    for (let item of cart.items) {
      const product = await Product.findById(item.product);

      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.product} is no longer available`,
        });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Not enough stock for product ${product.name}`,
        });
      }
    }

    // transform cart ->> order structure
    const orderItems = [];
    for (let item of cart.items) {
      const product = await Product.findById(item.product);

      orderItems.push({
        product: product._id,
        name: product.name,
        price: item.price, // latest price
        quantity: item.quantity,
      });
    }

    const subtotal = cart.items.reduce((t, i) => t + i.price * i.quantity, 0);
    const discount = 0; // later apply coupons
    const tax = 0; // GST/VAT
    const shippingFee = 0; // delivery charges

    const totalAmount = subtotal - discount + tax + shippingFee;

    const summary = {
      subtotal,
      discount,
      shippingFee,
      tax,
      totalAmount,
    };

    return res.status(200).json({
      success: true,
      message: "Cart validated, ready for order creation",
      data: {
        items: orderItems,
        totals: summary,
      },
    });
  } catch (error) {
    logger.error("moveCartToOrder Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error while preparing order",
    });
  }
};
