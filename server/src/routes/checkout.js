const express = require("express");
const router = express.Router();
const pool = require('../../../database/connection');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


// Forcing authentication on all checkout routes.
const requireAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    next();
};



router.post("/create-session", requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        // ---------------------------------------------------
        // 1. LOAD CART + PRODUCT DATA
        // ---------------------------------------------------
        const cartResult = await pool.query(
            `
      SELECT
        cart_items.product_id,
        cart_items.quantity,
        products.name,
        products.price
      FROM cart_items
      JOIN products
        ON cart_items.product_id = products.id
      WHERE cart_items.user_id = $1
      `,
            [userId]
        );

        const cart = cartResult.rows;

        // ---------------------------------------------------
        // EMPTY CART GUARD
        // ---------------------------------------------------
        if (!cart.length) {
            return res.status(400).json({
                message: "Cart is empty"
            });
        }

        // ---------------------------------------------------
        // 2. BUILD STRIPE LINE ITEMS
        // ---------------------------------------------------
        const line_items = cart.map(item => ({
            price_data: {
                currency: "usd",

                product_data: {
                    name: item.name
                },

                // Stripe expects cents
                unit_amount: Math.round(Number(item.price) * 100)
            },

            quantity: item.quantity
        }));

        // ---------------------------------------------------
        // 3. CREATE PENDING ORDER
        // ---------------------------------------------------
        const orderResult = await pool.query(
            `
      INSERT INTO orders (user_id)
      VALUES ($1)
      RETURNING *
      `,
            [userId]
        );

        const order = orderResult.rows[0];

        // ---------------------------------------------------
        // 4. CREATE STRIPE SESSION
        // ---------------------------------------------------
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],

            mode: "payment",

            line_items,

            success_url: "http://localhost:5173/success",

            cancel_url: "http://localhost:5173/checkout"
        });

        // ---------------------------------------------------
        // 5. SAVE STRIPE SESSION ID TO ORDER
        // ---------------------------------------------------
        await pool.query(
            `
      UPDATE orders
      SET stripe_session_id = $1
      WHERE id = $2
      `,
            [session.id, order.id]
        );

        // ---------------------------------------------------
        // 6. SEND CHECKOUT URL TO FRONTEND
        // ---------------------------------------------------
        res.json({
            url: session.url
        });

    } catch (err) {
        console.error("Checkout session error:", err);

        res.status(500).json({
            message: "Checkout failed"
        });
    }
});

module.exports = router;