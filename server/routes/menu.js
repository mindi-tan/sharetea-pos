const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  res.json({ message: 'menu route working' });
});

router.get('/menu-board', async (req, res) => {
  try {
    const { rows } = await db.query(`
      SELECT
        dc.category_id,
        dc.category_name,
        d.drink_id,
        d.drink_name,
        d.base_price
      FROM drink_category dc
      LEFT JOIN drink d ON dc.category_id = d.category_id
      WHERE dc.is_active = true
      ORDER BY dc.category_id, d.drink_name
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load menu board' });
  }
});

module.exports = router;
