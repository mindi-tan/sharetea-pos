const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all pending orders with their items
router.get('/orders', async (req, res) => {
  try {
    const ordersResult = await db.query(`
      SELECT order_id, order_ts
      FROM cust_order
      WHERE order_status = 'pending'
      ORDER BY order_ts ASC
    `);

    const orders = ordersResult.rows;

    if (orders.length === 0) {
      return res.json([]);
    }

    const orderIds = orders.map(o => o.order_id);

    const itemsResult = await db.query(`
      SELECT
        oi.order_id,
        oi.order_item_id,
        d.drink_name,
        oi.qty,
        oi.sweetness_level,
        oi.ice_level,
        COALESCE(
          json_agg(t.topping_name) FILTER (WHERE t.topping_name IS NOT NULL),
          '[]'
        ) AS toppings
      FROM order_item oi
      JOIN drink d ON oi.drink_id = d.drink_id
      LEFT JOIN order_item_topping oit ON oi.order_item_id = oit.order_item_id
      LEFT JOIN topping t ON oit.topping_id = t.topping_id
      WHERE oi.order_id = ANY($1)
      GROUP BY oi.order_id, oi.order_item_id, d.drink_name, oi.qty, oi.sweetness_level, oi.ice_level
      ORDER BY oi.order_item_id ASC
    `, [orderIds]);

    const itemsByOrder = {};
    itemsResult.rows.forEach(item => {
      if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
      itemsByOrder[item.order_id].push(item);
    });

    const result = orders.map(o => ({
      ...o,
      items: itemsByOrder[o.order_id] || [],
    }));

    res.json(result);
  } catch (err) {
    console.error('Kitchen GET /orders error:', err.message);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// PATCH mark an order as complete
router.patch('/orders/:id/complete', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query(
      `UPDATE cust_order SET order_status = 'completed' WHERE order_id = $1`,
      [id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Kitchen PATCH error:', err.message);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

module.exports = router;
