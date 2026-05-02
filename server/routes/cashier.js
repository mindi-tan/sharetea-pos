const express = require('express');
const router = express.Router();
const db = require('../db');

// POST cashier login — checks PIN against user_account.password
// Returns user info (without password) on success
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, error: 'PIN is required' });
    }

    const result = await db.query(
      'SELECT user_id, username, role FROM user_account WHERE password = $1',
      [password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid PIN' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// GET all drink categories
router.get('/categories', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM drink_category WHERE is_active = true ORDER BY category_id'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET all drinks (optionally filtered by category)
router.get('/drinks', async (req, res) => {
  try {
    const { category_id } = req.query;
    let query = `
      SELECT d.*, dc.category_name
      FROM drink d
      JOIN drink_category dc ON d.category_id = dc.category_id
      WHERE dc.is_active = true
    `;
    const params = [];
    if (category_id) {
      query += ' AND d.category_id = $1';
      params.push(category_id);
    }
    query += ' ORDER BY d.category_id, d.drink_name';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch drinks' });
  }
});

// GET all toppings
router.get('/toppings', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM topping ORDER BY topping_id'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch toppings' });
  }
});

// GET recent orders for cashier reference
router.get('/recent-orders', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        order_id,
        order_ts,
        order_status,
        order_total,
        user_id
      FROM cust_order
      ORDER BY order_ts DESC
      LIMIT 10
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch recent orders' });
  }
});

// POST place an order
// sweetness_level must be: '0', '50', or '100'
// ice_level must be: 'NO_ICE', 'LESS_ICE', or 'NORMAL_ICE'
router.post('/order', async (req, res) => {
  const client = await db.connect();
  try {
    const { items, user_id = 1 } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }
    const orderTotal = items.reduce((sum, item) => {
      return sum + Number(item.total_price || 0);
    }, 0);
    await client.query('BEGIN');
    const orderResult = await client.query(
      `INSERT INTO cust_order (order_ts, order_status, order_total, user_id)
       VALUES (NOW(), 'pending', $1, $2)
       RETURNING order_id`,
      [orderTotal.toFixed(2), user_id]
    );
    const order_id = orderResult.rows[0].order_id;
    for (const item of items) {
      const qty = Number(item.qty || 1);
      const drinkUnitPrice = Number(item.drink_unit_price || 0);
      const totalPrice = Number(item.total_price || 0);
      const rawSize = String(item.drink_size ?? item.size ?? 'M');
      const drinkSize = ['S', 'M', 'L'].includes(rawSize) ? rawSize : 'M';
      const toppingIds = Array.isArray(item.toppings) ? item.toppings : [];
      const itemResult = await client.query(
        `INSERT INTO order_item
          (order_id, drink_id, qty, sweetness_level, ice_level, drink_unit_price, total_price, drink_size)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING order_item_id`,
        [
          order_id,
          item.drink_id,
          qty,
          item.sweetness_level,
          item.ice_level,
          drinkUnitPrice,
          totalPrice,
          drinkSize,
        ]
      );
      const order_item_id = itemResult.rows[0].order_item_id;
      for (const topping_id of toppingIds) {
        await client.query(
          'INSERT INTO order_item_topping (order_item_id, topping_id) VALUES ($1, $2)',
          [order_item_id, topping_id]
        );
      }
    }
    await client.query('COMMIT');
    res.json({ success: true, order_id });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to place order' });
  } finally {
    client.release();
  }
});

module.exports = router;
