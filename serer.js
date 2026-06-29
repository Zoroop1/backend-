const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Middleware
app.use(cors());
app.use(express.json());

// DATABASE CONNECTION TEST
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error('Database connection error:', err);
  else console.log('✓ Database connected');
});

// ============ API ROUTES ============

// GET ALL PRODUCTS
app.get('/api/products', async (req, res) => {
  try {
    const { category, minPrice, maxPrice } = req.query;
    let query = 'SELECT * FROM items WHERE stock_quantity > 0';
    const params = [];

    if (category) {
      query += ' AND category_id = $' + (params.length + 1);
      params.push(category);
    }
    if (minPrice) {
      query += ' AND price >= $' + (params.length + 1);
      params.push(minPrice);
    }
    if (maxPrice) {
      query += ' AND price <= $' + (params.length + 1);
      params.push(maxPrice);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET PRODUCT BY ID
app.get('/api/products/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM items WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// GET CATEGORIES
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET REVIEWS FOR PRODUCT
app.get('/api/products/:id/reviews', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM reviews WHERE item_id = $1 AND approved = TRUE ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// POST REVIEW
app.post('/api/products/:id/reviews', async (req, res) => {
  try {
    const { customerName, email, rating, comment } = req.body;
    
    // Get or create customer
    let customer = await pool.query('SELECT id FROM customers WHERE email = $1', [email]);
    let customerId;
    
    if (customer.rows.length === 0) {
      const newCustomer = await pool.query(
        'INSERT INTO customers (name, email) VALUES ($1, $2) RETURNING id',
        [customerName, email]
      );
      customerId = newCustomer.rows[0].id;
    } else {
      customerId = customer.rows[0].id;
    }

    await pool.query(
      'INSERT INTO reviews (item_id, customer_id, rating, comment, approved) VALUES ($1, $2, $3, $4, FALSE)',
      [req.params.id, customerId, rating, comment]
    );

    res.json({ success: true, message: 'Review submitted for approval' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// POST CONTACT FORM
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    await pool.query(
      'INSERT INTO contact_submissions (name, email, message) VALUES ($1, $2, $3)',
      [name, email, message]
    );

    // TODO: Send email to Kai at info@thepurpleseahorse.ca

    res.json({ success: true, message: 'Message received' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit contact form' });
  }
});

// ============ ADMIN ROUTES (Will add authentication) ============

// GET DASHBOARD STATS (TODO: Add auth)
app.get('/api/admin/dashboard', async (req, res) => {
  try {
    const totalRevenue = await pool.query(
      'SELECT SUM(amount) as total FROM deposits WHERE status = \'completed\''
    );
    const topProducts = await pool.query(
      'SELECT item_id, COUNT(*) as orders FROM deposits GROUP BY item_id ORDER BY orders DESC LIMIT 5'
    );
    const lowStock = await pool.query(
      'SELECT * FROM items WHERE stock_quantity <= min_stock_alert ORDER BY stock_quantity'
    );

    res.json({
      totalRevenue: totalRevenue.rows[0].total || 0,
      topProducts: topProducts.rows,
      lowStock: lowStock.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

// ERROR HANDLING
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

// START SERVER
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✓ Server running on port ${PORT}`));
