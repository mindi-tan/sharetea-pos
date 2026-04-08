const express = require('express');
const router = express.Router();
const db = require('../db');

/** Must match values your DB accepts for cust_order.order_status */
const ALLOWED_STATUSES = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];

router.get('/summary', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
        COUNT(*)::int AS orders_today,
        COALESCE(SUM(order_total::numeric), 0)::text AS revenue_today,
        COUNT(*) FILTER (WHERE order_status = 'pending')::int AS pending_orders
      FROM cust_order
      WHERE order_ts::date = CURRENT_DATE`
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load summary' });
  }
});

router.get('/orders', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
        o.order_id,
        o.order_ts,
        o.order_status,
        o.order_total,
        o.user_id,
        COALESCE(
          json_agg(
            json_build_object(
              'order_item_id', oi.order_item_id,
              'drink_id', oi.drink_id,
              'drink_name', d.drink_name,
              'qty', oi.qty,
              'sweetness_level', oi.sweetness_level,
              'ice_level', oi.ice_level,
              'total_price', oi.total_price
            )
            ORDER BY oi.order_item_id
          ) FILTER (WHERE oi.order_item_id IS NOT NULL),
          '[]'::json
        ) AS items
      FROM cust_order o
      LEFT JOIN order_item oi ON o.order_id = oi.order_id
      LEFT JOIN drink d ON oi.drink_id = d.drink_id
      GROUP BY o.order_id, o.order_ts, o.order_status, o.order_total, o.user_id
      ORDER BY o.order_ts DESC
      LIMIT 100`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load orders' });
  }
});

router.patch('/orders/:orderId/status', async (req, res) => {
  const orderId = parseInt(req.params.orderId, 10);
  const { order_status } = req.body;
  if (!Number.isInteger(orderId)) {
    return res.status(400).json({ error: 'Invalid order id' });
  }
  if (!order_status || !ALLOWED_STATUSES.includes(order_status)) {
    return res.status(400).json({ error: 'Invalid order_status', allowed: ALLOWED_STATUSES });
  }
  try {
    const result = await db.query(
      `UPDATE cust_order SET order_status = $1 WHERE order_id = $2
       RETURNING order_id, order_ts, order_status, order_total, user_id`,
      [order_status, orderId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

module.exports = router;
