const express = require('express');
const router = express.Router();
const db = require('../db');

async function supportsDrinkSizeColumn(client) {
  const result = await client.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_name = 'order_item'
       AND column_name = 'drink_size'`
  );
  return result.rowCount > 0;
}

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

// GET all drinks with ingredients (optionally filtered by category)
router.get('/drinks', async (req, res) => {
  try {
    const { category_id } = req.query;

    let query = `
      SELECT 
        d.drink_id,
        d.category_id,
        d.drink_name,
        d.base_price,
        d.drink_size,
        dc.category_name,
        COALESCE(
          ARRAY_AGG(i.inv_item_name ORDER BY i.inv_item_name)
            FILTER (WHERE i.inv_item_name IS NOT NULL),
          '{}'
        ) AS ingredients
      FROM drink d
      JOIN drink_category dc ON d.category_id = dc.category_id
      LEFT JOIN drink_recipe dr ON d.drink_id = dr.drink_id
      LEFT JOIN inventory_item i ON dr.inv_item_id = i.inv_item_id
      WHERE dc.is_active = true
    `;

    const params = [];

    if (category_id) {
      query += ` AND d.category_id = $1`;
      params.push(category_id);
    }

    query += `
      GROUP BY 
        d.drink_id,
        d.category_id,
        d.drink_name,
        d.base_price,
        d.drink_size,
        dc.category_name
      ORDER BY d.category_id, d.drink_name
    `;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch drinks' });
  }
});

// GET all toppings with ingredients
router.get('/toppings', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        t.topping_id,
        t.topping_name,
        t.topping_price,
        COALESCE(
          ARRAY_AGG(i.inv_item_name ORDER BY i.inv_item_name)
            FILTER (WHERE i.inv_item_name IS NOT NULL),
          '{}'
        ) AS ingredients
      FROM topping t
      LEFT JOIN topping_recipe tr ON t.topping_id = tr.topping_id
      LEFT JOIN inventory_item i ON tr.inv_item_id = i.inv_item_id
      GROUP BY
        t.topping_id,
        t.topping_name,
        t.topping_price
      ORDER BY t.topping_id
    `);

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
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }
    // user_id defaults to 1 (guest) until OAuth is implemented

    const orderTotal = items.reduce((sum, item) => sum + Number(item.total_price || 0), 0);

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
    const insertDrinkSize = await supportsDrinkSizeColumn(client);
    for (const item of items) {
      const rawSize = String(item.drink_size ?? item.size ?? 'M');
      const drink_size = ['S', 'M', 'L'].includes(rawSize) ? rawSize : 'M';
      const toppingIds = Array.isArray(item.toppings) ? item.toppings : [];
      const itemQuery = insertDrinkSize
        ? `INSERT INTO order_item 
           (order_id, drink_id, qty, sweetness_level, ice_level, drink_unit_price, total_price, drink_size)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING order_item_id`
        : `INSERT INTO order_item 
           (order_id, drink_id, qty, sweetness_level, ice_level, drink_unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING order_item_id`;
      const itemParams = insertDrinkSize
        ? [
            order_id,
            item.drink_id,
            item.qty,
            item.sweetness_level,   // '0', '50', or '100'
            item.ice_level,         // 'NO_ICE', 'LESS_ICE', or 'NORMAL_ICE'
            item.drink_unit_price,
            item.total_price,
            drink_size,
          ]
        : [
            order_id,
            item.drink_id,
            item.qty,
            item.sweetness_level,
            item.ice_level,
            item.drink_unit_price,
            item.total_price,
          ];
      const itemResult = await client.query(
        itemQuery,
        itemParams
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
