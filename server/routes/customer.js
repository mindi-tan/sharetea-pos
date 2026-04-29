const express = require('express');
const router = express.Router();
const db = require('../db');

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
      query += ` AND d.category_id = $1`;
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
    const result = await db.query('SELECT * FROM topping ORDER BY topping_id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch toppings' });
  }
});

// POST place an order
// sweetness_level must be: '0', '50', or '100'
// ice_level must be: 'NO_ICE', 'LESS_ICE', or 'NORMAL_ICE'
router.post('/order', async (req, res) => {
  const client = await db.connect();
  try {
    const { items, user_id = 1 } = req.body;
    // user_id defaults to 1 (guest) until OAuth is implemented

    const orderTotal = items.reduce((sum, item) => sum + item.total_price, 0);

    await client.query('BEGIN');

    // Create order
    const orderResult = await client.query(
      `INSERT INTO cust_order (order_ts, order_status, order_total, user_id)
       VALUES (NOW(), 'pending', $1, $2)
       RETURNING order_id`,
      [orderTotal.toFixed(2), user_id]
    );
    const order_id = orderResult.rows[0].order_id;

    // Insert each order item
    for (const item of items) {
      const itemResult = await client.query(
        `INSERT INTO order_item 
           (order_id, drink_id, qty, sweetness_level, ice_level, drink_unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING order_item_id`,
        [
          order_id,
          item.drink_id,
          item.qty,
          item.sweetness_level,   // '0', '50', or '100'
          item.ice_level,         // 'NO_ICE', 'LESS_ICE', or 'NORMAL_ICE'
          item.drink_unit_price,
          item.total_price,
        ]
      );
      const order_item_id = itemResult.rows[0].order_item_id;

      for (const topping_id of item.toppings) {
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
