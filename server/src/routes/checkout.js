const express = require("express");
const router = express.Router();
const pool = require('../../../database/connection');
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

router.post("/create-session", async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Load cart
    const cartResult = await pool.query(
      `SELECT * FROM cart_items WHERE user_id = $1`,
      [userId]
    );

    const cart = cartResult.rows;

    if (!cart.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // 2. Build Stripe line items
    const line_items = cart.map(item => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.name
        },
        unit_amount: Math.round(Number(item.price) * 100)
      },
      quantity: item.quantity
    }));

    // 3. Create order (pending)
    const order = await pool.query(
      `INSERT INTO orders (user_id)
       VALUES ($1)
       RETURNING *`,
      [userId]
    );

    const orderId = order.rows[0].id;

    // 4. Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      success_url: "http://localhost:5173/success",
      cancel_url: "http://localhost:5173/checkout"
    });

    // 5. Store Stripe session on order
    await pool.query(
      `UPDATE orders
       SET stripe_session_id = $1
       WHERE id = $2`,
      [session.id, orderId]
    );

    res.json({ url: session.url });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Checkout failed" });
  }
});

module.exports = router;