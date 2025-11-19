import Cart from "../../models/cart.model.js";

export const getPopulatedCart = async (userId) => {
  const cart = await Cart.aggregate([
    // match cart by logged in user
    {
      $match: { user: userId },
    },
    // join product collection
    {
      $lookup: {
        from: "products",
        localField: "items.product", // in cart model as this
        foreignField: "_id", // id in product
        as: "productData",
      },
    },
    // merge product data into each item using $map
    {
      $addFields: {
        items: {
          $map: {
            input: "$items",
            as: "item",
            in: {
              product: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$productData",
                      as: "p",
                      cond: { $eq: ["$$p._id", "$$item.product"] },
                    },
                  },
                  0,
                ],
              },
              quantity: "$$item.quantity",
              price: "$$item.price",
            },
          },
        },
      },
    },
    // calculate total inside pipeline
    {
      $addFields: {
        totalItems: {
          $sum: {
            $map: {
              input: "$items",
              as: "i",
              in: "$$i.quantity",
            },
          },
        },
        totalPrice: {
          $sum: {
            $map: {
              input: "$items",
              as: "i",
              in: { $multiply: ["$$i.quantity", "$$i.price"] },
            },
          },
        },
      },
    },
    // remove temporary productData
    {
      $project: {
        productData: 0,
      },
    },
  ]);
  return cart[0] || { items: [], totalItems: 0, totalPrice: 0 };
};
