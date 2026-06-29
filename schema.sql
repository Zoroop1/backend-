-- CATEGORIES
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  emoji VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW()
);

-- ITEMS/PRODUCTS
CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  emoji VARCHAR(10),
  category_id INT REFERENCES categories(id) ON DELETE SET NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
  cost DECIMAL(10, 2),
  stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  min_stock_alert INT DEFAULT 5,
  status VARCHAR(20) CHECK (status IN ('in_stock', 'low_stock', 'out_of_stock')),
  image_url VARCHAR(500),
  watermarked_image_url VARCHAR(500),
  description TEXT,
  seo_title VARCHAR(160),
  seo_description VARCHAR(160),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- INVENTORY LOG (audit trail)
CREATE TABLE inventory_log (
  id SERIAL PRIMARY KEY,
  item_id INT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  old_quantity INT,
  new_quantity INT,
  reason VARCHAR(100),
  changed_at TIMESTAMP DEFAULT NOW()
);

-- PRICE HISTORY
CREATE TABLE price_history (
  id SERIAL PRIMARY KEY,
  item_id INT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  old_price DECIMAL(10, 2),
  new_price DECIMAL(10, 2),
  changed_at TIMESTAMP DEFAULT NOW()
);

-- CUSTOMERS
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(20),
  total_purchases INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- DEPOSITS/HOLDS
CREATE TABLE deposits (
  id SERIAL PRIMARY KEY,
  customer_id INT REFERENCES customers(id),
  item_id INT REFERENCES items(id),
  amount DECIMAL(10, 2),
  stripe_payment_id VARCHAR(200),
  status VARCHAR(50) CHECK (status IN ('pending', 'completed', 'cancelled', 'picked_up')),
  created_at TIMESTAMP DEFAULT NOW(),
  picked_up_at TIMESTAMP
);

-- REVIEWS
CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  item_id INT REFERENCES items(id) ON DELETE CASCADE,
  customer_id INT REFERENCES customers(id),
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- CONTACT FORM SUBMISSIONS
CREATE TABLE contact_submissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150),
  email VARCHAR(150),
  message TEXT,
  status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMP DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_items_category ON items(category_id);
CREATE INDEX idx_inventory_item ON inventory_log(item_id);
CREATE INDEX idx_price_history_item ON price_history(item_id);
CREATE INDEX idx_deposits_customer ON deposits(customer_id);
CREATE INDEX idx_reviews_item ON reviews(item_id);
