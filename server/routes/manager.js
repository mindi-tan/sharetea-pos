const express = require('express');
const router = express.Router();
const db = require('../db');

const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();

function getAllowedManagerEmails() {
  return new Set(
    String(process.env.ALLOWED_MANAGER_EMAILS || '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

async function verifyGoogleIdToken(idToken) {
  const tokenInfoRes = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );

  if (!tokenInfoRes.ok) {
    return { ok: false, error: 'Invalid Google token' };
  }

  const tokenInfo = await tokenInfoRes.json();

  if (GOOGLE_CLIENT_ID && tokenInfo.aud !== GOOGLE_CLIENT_ID) {
    return { ok: false, error: 'Google token audience mismatch' };
  }

  const issuer = String(tokenInfo.iss || '');
  if (issuer !== 'accounts.google.com' && issuer !== 'https://accounts.google.com') {
    return { ok: false, error: 'Invalid Google token issuer' };
  }

  if (String(tokenInfo.email_verified) !== 'true') {
    return { ok: false, error: 'Google account email is not verified' };
  }

  return { ok: true, tokenInfo };
}

router.post('/auth/google', async (req, res) => {
  const { idToken } = req.body || {};

  if (!idToken) {
    return res.status(400).json({ error: 'Missing Google idToken' });
  }

  const allowedEmails = getAllowedManagerEmails();
  if (allowedEmails.size === 0) {
    return res.status(500).json({ error: 'ALLOWED_MANAGER_EMAILS is not configured' });
  }

  try {
    const verification = await verifyGoogleIdToken(idToken);
    if (!verification.ok) {
      return res.status(401).json({ error: verification.error });
    }

    const email = String(verification.tokenInfo.email || '').toLowerCase();
    if (!allowedEmails.has(email)) {
      return res.status(403).json({ error: 'This account is not allowed to access Manager' });
    }

    return res.json({
      ok: true,
      user: {
        email,
        name: verification.tokenInfo.name || email,
        picture: verification.tokenInfo.picture || '',
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to verify Google sign-in' });
  }
});

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
              'drink_size', COALESCE(to_jsonb(oi)->>'drink_size', to_jsonb(oi)->>'size', 'M'),
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

// View all employees/managers from user_account.
router.get('/employees', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT user_id, username, password, role
      FROM user_account
      ORDER BY user_id
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load employees' });
  }
});

// Add a new employee/manager.
router.post('/employees', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Missing employee fields' });
    }

    if (!['MANAGER', 'CASHIER'].includes(role)) {
      return res.status(400).json({ error: 'Role must be MANAGER or CASHIER' });
    }

    const { rows } = await db.query(
      `
      INSERT INTO user_account (username, password, role)
      VALUES ($1, $2, $3)
      RETURNING user_id, username, password, role
      `,
      [username, password, role]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);

    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username already exists' });
    }

    res.status(500).json({ error: 'Failed to add employee' });
  }
});

// Update an existing employee/manager.
router.patch('/employees/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const { username, password, role } = req.body;

    if (!Number.isInteger(userId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    if (!username || !role) {
      return res.status(400).json({ error: 'Missing employee fields' });
    }

    if (!['MANAGER', 'CASHIER'].includes(role)) {
      return res.status(400).json({ error: 'Role must be MANAGER or CASHIER' });
    }

    let query = `UPDATE user_account SET username = $1, role = $2`;
    let params = [username, role, userId];

    // Only update password if provided (not blank)
    if (password && password.trim()) {
      query = `UPDATE user_account SET username = $1, password = $2, role = $3`;
      params = [username, password, role, userId];
    }

    query += ` WHERE user_id = $${params.length} RETURNING user_id, username, password, role`;

    const { rows } = await db.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);

    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username already exists' });
    }

    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// Delete an employee/manager.
// This may fail if the user is referenced by orders or supply orders.
router.delete('/employees/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);

    if (!Number.isInteger(userId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    const result = await db.query(
      `DELETE FROM user_account WHERE user_id = $1`,
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);

    if (err.code === '23503') {
      return res.status(409).json({
        error:
          'Cannot delete this employee because they are referenced by existing orders. Update their role or keep the account instead.',
      });
    }

    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

// Routes for adding/deleting drinks.
router.get('/drinks', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT d.drink_id, d.drink_name, d.base_price, d.category_id, dc.category_name
      FROM drink d
      JOIN drink_category dc ON d.category_id = dc.category_id
      WHERE dc.is_active = true
      ORDER BY d.drink_id
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load drinks' });
  }
});

router.post('/drinks', async (req, res) => {
  try {
    const { drink_name, category_id, base_price } = req.body;

    if (!drink_name || !category_id || base_price === undefined) {
      return res.status(400).json({ error: 'Missing drink fields' });
    }

    const { rows } = await db.query(
      `INSERT INTO drink (drink_name, category_id, base_price)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [drink_name, category_id, base_price]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add drink' });
  }
});

router.delete('/drinks/:drinkId', async (req, res) => {
  try {
    const drinkId = parseInt(req.params.drinkId, 10);

    if (!Number.isInteger(drinkId)) {
      return res.status(400).json({ error: 'Invalid drink id' });
    }

    const result = await db.query(
      `DELETE FROM drink WHERE drink_id = $1`,
      [drinkId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Drink not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete drink' });
  }
});

//routes for editing inventory
router.get('/inventory', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT *
      FROM inventory_item
      ORDER BY inv_item_id
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load inventory' });
  }
});

router.post('/inventory', async (req, res) => {
  try {
    const { inv_item_name, inv_item_type, unit, current_qty } = req.body;

    if (!inv_item_name || !inv_item_type || !unit) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const { rows } = await db.query(
      `INSERT INTO inventory_item (inv_item_name, inv_item_type, unit, current_qty)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [inv_item_name, inv_item_type, unit, current_qty || 0]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add inventory item' });
  }
});

// invenotry stats routes
// View recent supply/restock history.
// This joins supply_order with inventory_item so the frontend can show item names.
router.get('/supply-orders', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        so.supply_order_id,
        so.created_ts,
        so.ordered_by_user_id,
        so.inv_item_id,
        ii.inv_item_name,
        ii.unit,
        so.qty_requested
      FROM supply_order so
      JOIN inventory_item ii ON so.inv_item_id = ii.inv_item_id
      ORDER BY so.created_ts DESC
      LIMIT 50
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load supply orders' });
  }
});

router.patch('/inventory/:invItemId', async (req, res) => {
  try {
    const invItemId = parseInt(req.params.invItemId, 10);
    const { current_qty } = req.body;

    if (!Number.isInteger(invItemId)) {
      return res.status(400).json({ error: 'Invalid inventory item id' });
    }

    const newQty = Number(current_qty);

    if (Number.isNaN(newQty) || newQty < 0) {
      return res.status(400).json({ error: 'Quantity must be a non-negative number' });
    }

    const currentResult = await db.query(
      `SELECT current_qty
       FROM inventory_item
       WHERE inv_item_id = $1`,
      [invItemId]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    const oldQty = Number(currentResult.rows[0].current_qty);
    const qtyIncrease = newQty - oldQty;

    const { rows } = await db.query(
      `UPDATE inventory_item
       SET current_qty = $1
       WHERE inv_item_id = $2
       RETURNING inv_item_id, inv_item_name, inv_item_type, unit, current_qty`,
      [newQty, invItemId]
    );

    if (qtyIncrease > 0) {
      await db.query(
        `INSERT INTO supply_order (
          created_ts,
          ordered_by_user_id,
          inv_item_id,
          qty_requested
        )
        VALUES (CURRENT_TIMESTAMP, $1, $2, $3)`,
        [1, invItemId, qtyIncrease]
      );
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update inventory quantity' });
  }
});

// Delete an inventory item and remove it from all recipes.
router.delete('/inventory/:invItemId', async (req, res) => {
  try {
    const invItemId = parseInt(req.params.invItemId, 10);

    if (!Number.isInteger(invItemId)) {
      return res.status(400).json({ error: 'Invalid inventory item id' });
    }

    console.log(`Attempting to delete inventory item ${invItemId}`);

    // Delete in order to avoid foreign key constraint violations:
    // 1. Delete from drink_recipe (recipes that use this ingredient)
    const recipeDeleteResult = await db.query(
      `DELETE FROM drink_recipe WHERE inv_item_id = $1`,
      [invItemId]
    );
    console.log(`Deleted ${recipeDeleteResult.rowCount} recipe items`);

    // 2. Delete from supply_order (supply orders for this ingredient)
    const supplyDeleteResult = await db.query(
      `DELETE FROM supply_order WHERE inv_item_id = $1`,
      [invItemId]
    );
    console.log(`Deleted ${supplyDeleteResult.rowCount} supply orders`);

    // 3. Then delete the inventory item itself
    const result = await db.query(
      `DELETE FROM inventory_item WHERE inv_item_id = $1`,
      [invItemId]
    );
    console.log(`Deleted ${result.rowCount} inventory items`);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Delete inventory error:', err.message, err.code, err);
    res.status(500).json({ error: `Failed to delete inventory item: ${err.message}` });
  }
});

// ================================
// Manager report routes
// ================================

// Sales Report: sales by menu item for a given time window.
router.get('/reports/sales-by-item', async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: 'Missing start or end date' });
    }

    const { rows } = await db.query(
      `
      SELECT
        d.drink_id,
        d.drink_name,
        SUM(oi.qty)::int AS qty_sold,
        COALESCE(SUM(oi.total_price::numeric), 0)::text AS total_sales
      FROM cust_order o
      JOIN order_item oi ON o.order_id = oi.order_id
      JOIN drink d ON oi.drink_id = d.drink_id
      WHERE o.order_ts >= $1
        AND o.order_ts < $2
      GROUP BY d.drink_id, d.drink_name
      ORDER BY qty_sold DESC, d.drink_name
      `,
      [start, end]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load sales report' });
  }
});

// Product Usage Chart: inventory used by drinks sold in a given time window.
// This estimates usage using drink_recipe * quantity ordered.
router.get('/reports/product-usage', async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: 'Missing start or end date' });
    }

    const { rows } = await db.query(
      `
      SELECT
        ii.inv_item_id,
        ii.inv_item_name,
        ii.unit,
        COALESCE(SUM(oi.qty * dr.qty_needed), 0)::numeric(12,2)::text AS used_qty
      FROM cust_order o
      JOIN order_item oi ON o.order_id = oi.order_id
      JOIN drink_recipe dr ON oi.drink_id = dr.drink_id
      JOIN inventory_item ii ON dr.inv_item_id = ii.inv_item_id
      WHERE o.order_ts >= $1
        AND o.order_ts < $2
      GROUP BY ii.inv_item_id, ii.inv_item_name, ii.unit
      ORDER BY COALESCE(SUM(oi.qty * dr.qty_needed), 0) DESC, ii.inv_item_name
      `,
      [start, end]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load product usage report' });
  }
});

// X-Report: hourly sales activity for the current day.
// This has no side effects.
router.get('/reports/x-report', async (req, res) => {
  try {
    const { rows } = await db.query(
      `
      SELECT
        EXTRACT(HOUR FROM order_ts)::int AS hour,
        COUNT(*)::int AS order_count,
        COALESCE(SUM(order_total::numeric), 0)::text AS sales
      FROM cust_order
      WHERE order_ts::date = CURRENT_DATE
      GROUP BY EXTRACT(HOUR FROM order_ts)
      ORDER BY hour
      `
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load X-report' });
  }
});

// Z-Report status: returns today's filed report or null.
// No side effects.
router.get('/reports/z-report/today', async (req, res) => {
  try {
    const { rows } = await db.query(
      `
      SELECT report_date,
             run_at,
             total_orders,
             total_sales::text AS total_sales,
             tax_amount::text  AS tax_amount
      FROM z_report
      WHERE report_date = CURRENT_DATE
      `
    );
    res.json(rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load Z-report status' });
  }
});

// Z-Report: end-of-day close. Computes totals and inserts a row.
// Idempotent via PRIMARY KEY (report_date) — duplicate calls return 409.
router.post('/reports/z-report', async (req, res) => {
  try {
    const { rows: aggRows } = await db.query(
      `
      SELECT
        COUNT(DISTINCT co.order_id)::int                                  AS total_orders,
        COALESCE(SUM(co.order_total::numeric), 0)                         AS total_sales,
        COALESCE(SUM(oi.total_price - (oi.drink_unit_price * oi.qty)), 0) AS tax_amount
      FROM cust_order co
      LEFT JOIN order_item oi ON oi.order_id = co.order_id
      WHERE co.order_ts >= CURRENT_DATE
        AND co.order_ts <  CURRENT_DATE + INTERVAL '1 day'
      `
    );

    const totals = aggRows[0] || { total_orders: 0, total_sales: 0, tax_amount: 0 };

    try {
      const { rows: insertedRows } = await db.query(
        `
        INSERT INTO z_report (report_date, total_orders, total_sales, tax_amount)
        VALUES (CURRENT_DATE, $1, $2, $3)
        RETURNING report_date,
                  run_at,
                  total_orders,
                  total_sales::text AS total_sales,
                  tax_amount::text  AS tax_amount
        `,
        [totals.total_orders, totals.total_sales, totals.tax_amount]
      );
      res.status(201).json(insertedRows[0]);
    } catch (insertErr) {
      // PostgreSQL unique_violation = already filed today
      if (insertErr.code === '23505') {
        return res.status(409).json({ error: 'Z-report has already been filed today' });
      }
      throw insertErr;
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to run Z-report' });
  }
});

// Restock Report: items below a threshold.
// Since inventory_item does not currently have min_qty, this uses a query threshold.
router.get('/reports/restock', async (req, res) => {
  try {
    const threshold = Number(req.query.threshold || 1000);

    if (Number.isNaN(threshold) || threshold < 0) {
      return res.status(400).json({ error: 'Invalid threshold' });
    }

    const { rows } = await db.query(
      `
      SELECT
        inv_item_id,
        inv_item_name,
        inv_item_type,
        unit,
        current_qty
      FROM inventory_item
      WHERE current_qty < $1
      ORDER BY current_qty ASC, inv_item_name
      `,
      [threshold]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load restock report' });
  }
});

// ================================
// Drink recipe routes
// These let managers define which inventory items are used by each drink.
// ================================

// Get all inventory items used in one drink recipe.
router.get('/drinks/:drinkId/recipe', async (req, res) => {
  try {
    const drinkId = parseInt(req.params.drinkId, 10);

    if (!Number.isInteger(drinkId)) {
      return res.status(400).json({ error: 'Invalid drink id' });
    }

    const { rows } = await db.query(
      `
      SELECT
        dr.drink_id,
        dr.inv_item_id,
        ii.inv_item_name,
        ii.unit,
        dr.qty_needed
      FROM drink_recipe dr
      JOIN inventory_item ii ON dr.inv_item_id = ii.inv_item_id
      WHERE dr.drink_id = $1
      ORDER BY ii.inv_item_name
      `,
      [drinkId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load drink recipe' });
  }
});

// Add or update one inventory item in a drink recipe.
router.put('/drinks/:drinkId/recipe', async (req, res) => {
  try {
    const drinkId = parseInt(req.params.drinkId, 10);
    const invItemId = Number(req.body.inv_item_id);
    const qtyNeeded = Number(req.body.qty_needed);

    if (!Number.isInteger(drinkId)) {
      return res.status(400).json({ error: 'Invalid drink id' });
    }

    if (!Number.isInteger(invItemId)) {
      return res.status(400).json({ error: 'Invalid inventory item id' });
    }

    if (Number.isNaN(qtyNeeded) || qtyNeeded <= 0) {
      return res.status(400).json({ error: 'Quantity needed must be greater than 0' });
    }

    const { rows } = await db.query(
      `
      INSERT INTO drink_recipe (drink_id, inv_item_id, qty_needed)
      VALUES ($1, $2, $3)
      ON CONFLICT (drink_id, inv_item_id)
      DO UPDATE SET qty_needed = EXCLUDED.qty_needed
      RETURNING drink_id, inv_item_id, qty_needed
      `,
      [drinkId, invItemId, qtyNeeded]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save drink recipe item' });
  }
});

// Remove one inventory item from a drink recipe.
router.delete('/drinks/:drinkId/recipe/:invItemId', async (req, res) => {
  try {
    const drinkId = parseInt(req.params.drinkId, 10);
    const invItemId = parseInt(req.params.invItemId, 10);

    if (!Number.isInteger(drinkId) || !Number.isInteger(invItemId)) {
      return res.status(400).json({ error: 'Invalid recipe id' });
    }

    const result = await db.query(
      `
      DELETE FROM drink_recipe
      WHERE drink_id = $1 AND inv_item_id = $2
      `,
      [drinkId, invItemId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Recipe item not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove drink recipe item' });
  }
});

module.exports = router;
