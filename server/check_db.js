const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function checkDatabase() {
  const client = await pool.connect();
  try {
    console.log('=== CHECKING DATABASE SCHEMA ===\n');

    // Check drink table columns
    const drinkColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'drink'
      ORDER BY ordinal_position
    `);
    console.log('DRINK table columns:');
    drinkColumns.rows.forEach(row => console.log(`  - ${row.column_name}: ${row.data_type}`));

    // Check order_item table columns
    const orderItemColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'order_item'
      ORDER BY ordinal_position
    `);
    console.log('\nORDER_ITEM table columns:');
    orderItemColumns.rows.forEach(row => console.log(`  - ${row.column_name}: ${row.data_type}`));

    // Check drink count
    const drinkCount = await client.query('SELECT COUNT(*) as count FROM drink');
    console.log(`\nTotal drinks in database: ${drinkCount.rows[0].count}`);

    // Check categories
    const categories = await client.query('SELECT category_id, category_name FROM drink_category ORDER BY category_id');
    console.log('\nDrink categories:');
    categories.rows.forEach(row => console.log(`  - ${row.category_id}: ${row.category_name}`));

    // Check if all drinks have valid categories
    const drinksWithoutCategory = await client.query(`
      SELECT d.drink_id, d.drink_name, d.category_id 
      FROM drink d
      WHERE d.category_id IS NULL
    `);
    if (drinksWithoutCategory.rows.length > 0) {
      console.log('\n⚠️  DRINKS WITHOUT CATEGORY:');
      drinksWithoutCategory.rows.forEach(row => 
        console.log(`  - drink_id ${row.drink_id}: ${row.drink_name} (category_id: ${row.category_id})`)
      );
    } else {
      console.log('\n✓ All drinks have valid categories');
    }

    // Check for invalid drink_ids referenced in order_item
    const invalidDrinkIds = await client.query(`
      SELECT DISTINCT oi.drink_id 
      FROM order_item oi
      LEFT JOIN drink d ON oi.drink_id = d.drink_id
      WHERE d.drink_id IS NULL
    `);
    if (invalidDrinkIds.rows.length > 0) {
      console.log('\n⚠️  INVALID DRINK IDS IN ORDERS:');
      invalidDrinkIds.rows.forEach(row => console.log(`  - drink_id: ${row.drink_id}`));
    } else {
      console.log('✓ All order items reference valid drinks');
    }

    // Check recent orders
    const recentOrders = await client.query(`
      SELECT o.order_id, o.order_ts, o.order_status, COUNT(oi.order_item_id) as item_count
      FROM cust_order o
      LEFT JOIN order_item oi ON o.order_id = oi.order_id
      GROUP BY o.order_id
      ORDER BY o.order_id DESC
      LIMIT 5
    `);
    console.log('\nRecent 5 orders:');
    recentOrders.rows.forEach(row => 
      console.log(`  - Order ${row.order_id}: ${row.order_ts} (${row.item_count} items, status: ${row.order_status})`)
    );

    // Show drinks that exist
    const allDrinks = await client.query(`
      SELECT d.drink_id, d.drink_name, dc.category_name 
      FROM drink d
      LEFT JOIN drink_category dc ON d.category_id = dc.category_id
      ORDER BY d.drink_id
      LIMIT 20
    `);
    console.log('\nFirst 20 drinks:');
    allDrinks.rows.forEach(row => 
      console.log(`  - drink_id ${row.drink_id}: ${row.drink_name} (${row.category_name})`)
    );

  } catch (err) {
    console.error('Error checking database:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDatabase();
