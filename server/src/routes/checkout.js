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

            metadata: {
                user_id: String(userId),
                order_id: String(order.id)
            },

            success_url:
                "http://localhost:5173/success?session_id={CHECKOUT_SESSION_ID}",

            cancel_url:
                "http://localhost:5173/checkout"
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

router.get("/verify/:sessionId", requireAuth, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.id;

        // ---------------------------------------
        // 1. VERIFY SESSION WITH STRIPE
        // ---------------------------------------
        const session =
            await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status !== "paid") {
            return res.status(400).json({
                message: "Payment not completed"
            });
        }

        // ---------------------------------------
        // 2. FIND ORDER
        // ---------------------------------------
        const orderResult = await pool.query(
            `
            SELECT *
            FROM orders
            WHERE stripe_session_id = $1
            `,
            [sessionId]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({
                message: "Order not found"
            });
        }

        const order = orderResult.rows[0];

        // ---------------------------------------
        // 3. SECURITY CHECK
        // ---------------------------------------
        if (order.user_id !== userId) {
            return res.status(403).json({
                message: "Forbidden"
            });
        }

        // ---------------------------------------
        // 4. ALREADY FINALIZED?
        // ---------------------------------------
        if (order.status === "paid") {
            return res.json({
                message: "Order already finalized",
                orderId: order.id
            });
        }

        // ---------------------------------------
        // 5. LOAD CART SNAPSHOT
        // ---------------------------------------
        const cartResult = await pool.query(
            `
            SELECT
                cart_items.product_id,
                cart_items.quantity,
                products.price
            FROM cart_items
            JOIN products
                ON products.id = cart_items.product_id
            WHERE cart_items.user_id = $1
            `,
            [userId]
        );

        const cart = cartResult.rows;

        // ---------------------------------------
        // 6. CREATE ORDER ITEMS
        // ---------------------------------------
        for (const item of cart) {
            await pool.query(
                `
                INSERT INTO order_items (
                    order_id,
                    product_id,
                    quantity,
                    price_at_time
                )
                VALUES ($1, $2, $3, $4)
                `,
                [
                    order.id,
                    item.product_id,
                    item.quantity,
                    item.price
                ]
            );
        }

        // ---------------------------------------
        // 7. CLEAR CART
        // ---------------------------------------
        await pool.query(
            `
            DELETE FROM cart_items
            WHERE user_id = $1
            `,
            [userId]
        );

        // ---------------------------------------
        // 8. MARK ORDER PAID
        // ---------------------------------------
        await pool.query(
            `
            UPDATE orders
            SET status = 'paid'
            WHERE id = $1
            `,
            [order.id]
        );

        // ---------------------------------------
        // 9. SUCCESS
        // ---------------------------------------
        res.json({
            success: true,
            orderId: order.id
        });

    } catch (err) {
        console.error("Verify checkout error:", err);

        res.status(500).json({
            message: "Verification failed"
        });
    }
});

module.exports = router;