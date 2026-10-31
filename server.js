require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const jwtSecret = process.env.JWT_SECRET || 'earthguard-dev-secret';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;

const demoStore = {
  users: [
    {
      id: 1,
      email: 'admin@earthguard.com',
      password_hash: bcrypt.hashSync('admin123', 10),
      role: 'admin',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 2,
      email: 'customer@earthguard.com',
      password_hash: bcrypt.hashSync('customer123', 10),
      role: 'customer',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  customers: [
    {
      id: 1,
      user_id: 1,
      full_name: 'EarthGuard Admin',
      phone: '+1-555-0100',
      address: '123 Climate Way',
      city: 'Green Valley',
      country: 'USA',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 2,
      user_id: 2,
      full_name: 'Ava Green',
      phone: '+1-555-0199',
      address: '98 Eco Road',
      city: 'Oakland',
      country: 'USA',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  products: [
    { id: 1, name: 'Eco Starter Kit', description: 'A beginner-friendly package for low-waste living.', category: 'Home', price: 29.99, stock: 25, is_active: true, created_by_user_id: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 2, name: 'Solar Lantern', description: 'Portable and sustainable lighting for homes and camps.', category: 'Energy', price: 49.0, stock: 18, is_active: true, created_by_user_id: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],
  services: [
    { id: 1, name: 'Carbon Audit', description: 'Carbon footprint review and sustainability action plan.', price: 149.0, duration_days: 14, is_active: true, created_by_user_id: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 2, name: 'Green Office Assessment', description: 'Optimization of office environmental practices.', price: 280.0, duration_days: 21, is_active: true, created_by_user_id: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],
  orders: [
    { id: 1, customer_id: 2, user_id: 2, status: 'paid', total_amount: 179.99, currency: 'USD', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 2, customer_id: 1, user_id: 1, status: 'pending', total_amount: 49.0, currency: 'USD', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ],
  order_items: [
    { id: 1, order_id: 1, product_id: 1, service_id: null, quantity: 1, unit_price: 29.99, subtotal: 29.99, created_at: new Date().toISOString() },
    { id: 2, order_id: 1, service_id: 1, product_id: null, quantity: 1, unit_price: 149.0, subtotal: 149.0, created_at: new Date().toISOString() },
    { id: 3, order_id: 2, product_id: 2, service_id: null, quantity: 1, unit_price: 49.0, subtotal: 49.0, created_at: new Date().toISOString() },
  ],
  payments: [
    { id: 1, order_id: 1, user_id: 2, amount: 179.99, payment_method: 'card', payment_status: 'paid', transaction_reference: 'demo_txn_1001', created_at: new Date().toISOString() },
    { id: 2, order_id: 2, user_id: 1, amount: 49.0, payment_method: 'card', payment_status: 'pending', transaction_reference: 'demo_txn_1002', created_at: new Date().toISOString() },
  ],
  messages: [
    { id: 1, sender_user_id: 1, receiver_user_id: 2, subject: 'Welcome to EarthGuard', body: 'Welcome to the EarthGuard community. Let’s protect the planet together.', is_read: false, created_at: new Date().toISOString() },
    { id: 2, sender_user_id: 2, receiver_user_id: 1, subject: 'Question about service', body: 'Can I add a solar advisory plan to my order?', is_read: true, created_at: new Date().toISOString() },
  ],
  ownership: [
    { id: 1, user_id: 1, resource_type: 'user', resource_id: 1, permission_level: 'owner', granted_at: new Date().toISOString() },
    { id: 2, user_id: 2, resource_type: 'user', resource_id: 2, permission_level: 'owner', granted_at: new Date().toISOString() },
  ],
};

const buildToken = (user) => jwt.sign({ id: user.id, email: user.email, role: user.role }, jwtSecret, { expiresIn: '7d' });

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

const getUserById = (userId) => demoStore.users.find((user) => Number(user.id) === Number(userId));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: pool ? 'postgres' : 'demo-mode', time: new Date().toISOString() });
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, fullName, role = 'customer' } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existingUser = demoStore.users.find((user) => user.email === normalizedEmail);
  if (existingUser) {
    return res.status(409).json({ message: 'A user with that email already exists.' });
  }

  const newUserId = demoStore.users.length ? Math.max(...demoStore.users.map((user) => user.id)) + 1 : 1;
  const passwordHash = bcrypt.hashSync(password, 10);

  const newUser = {
    id: newUserId,
    email: normalizedEmail,
    password_hash: passwordHash,
    role,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  demoStore.users.push(newUser);
  demoStore.customers.push({
    id: demoStore.customers.length ? Math.max(...demoStore.customers.map((customer) => customer.id)) + 1 : 1,
    user_id: newUserId,
    full_name: fullName || 'New Customer',
    phone: '',
    address: '',
    city: '',
    country: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  demoStore.ownership.push({
    id: demoStore.ownership.length ? Math.max(...demoStore.ownership.map((entry) => entry.id)) + 1 : 1,
    user_id: newUserId,
    resource_type: 'user',
    resource_id: newUserId,
    permission_level: 'owner',
    granted_at: new Date().toISOString(),
  });

  const token = buildToken(newUser);
  return res.status(201).json({ token, user: { id: newUser.id, email: newUser.email, role: newUser.role } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = demoStore.users.find((candidate) => candidate.email === normalizedEmail);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const token = buildToken(user);
  return res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

app.get('/api/users/me', authMiddleware, (req, res) => {
  const user = getUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  return res.json({
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    created_at: user.created_at,
  });
});

app.get('/api/dashboard', authMiddleware, (req, res) => {
  const customerCount = demoStore.customers.length;
  const orderCount = demoStore.orders.length;
  const paymentCount = demoStore.payments.length;
  const messageCount = demoStore.messages.length;

  const baseResponse = {
    metrics: {
      users: demoStore.users.length,
      customers: customerCount,
      orders: orderCount,
      payments: paymentCount,
      products: demoStore.products.length,
      services: demoStore.services.length,
      messages: messageCount,
    },
    products: demoStore.products,
    services: demoStore.services,
    orders: demoStore.orders,
    recentMessages: demoStore.messages.slice(-3).reverse(),
    user: getUserById(req.user.id),
  };

  if (req.user.role === 'customer') {
    baseResponse.orders = demoStore.orders.filter((order) => Number(order.user_id) === Number(req.user.id));
    baseResponse.messages = demoStore.messages.filter((message) => Number(message.sender_user_id) === Number(req.user.id) || Number(message.receiver_user_id) === Number(req.user.id));
  }

  return res.json(baseResponse);
});

app.get('/api/products', authMiddleware, (req, res) => {
  return res.json(demoStore.products);
});

app.get('/api/services', authMiddleware, (req, res) => {
  return res.json(demoStore.services);
});

app.get('/api/messages', authMiddleware, (req, res) => {
  const messages = demoStore.messages.filter(
    (entry) => Number(entry.sender_user_id) === Number(req.user.id) || Number(entry.receiver_user_id) === Number(req.user.id)
  );
  return res.json(messages);
});

app.post('/api/messages', authMiddleware, (req, res) => {
  const { receiverUserId, subject, body } = req.body;
  if (!receiverUserId || !body) {
    return res.status(400).json({ message: 'Receiver and body are required.' });
  }

  const message = {
    id: demoStore.messages.length ? Math.max(...demoStore.messages.map((entry) => entry.id)) + 1 : 1,
    sender_user_id: req.user.id,
    receiver_user_id: Number(receiverUserId),
    subject: subject || 'New message',
    body,
    is_read: false,
    created_at: new Date().toISOString(),
  };

  demoStore.messages.push(message);
  return res.status(201).json({ message: 'Message sent successfully.', message });
});

app.get('/api/orders', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.json(demoStore.orders.filter((order) => Number(order.user_id) === Number(req.user.id)));
  }
  return res.json(demoStore.orders);
});

app.post('/api/orders', authMiddleware, (req, res) => {
  const { customerId, items = [], totalAmount = 0, currency = 'USD' } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Order items are required.' });
  }

  const order = {
    id: demoStore.orders.length ? Math.max(...demoStore.orders.map((entry) => entry.id)) + 1 : 1,
    customer_id: customerId || demoStore.customers.find((customer) => Number(customer.user_id) === Number(req.user.id))?.id,
    user_id: req.user.id,
    status: 'pending',
    total_amount: Number(totalAmount) || 0,
    currency,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  demoStore.orders.push(order);
  return res.status(201).json({ message: 'Order created.', order });
});

app.get('/api/payments', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.json(demoStore.payments.filter((payment) => Number(payment.user_id) === Number(req.user.id)));
  }
  return res.json(demoStore.payments);
});

app.post('/api/payments', authMiddleware, (req, res) => {
  const { orderId, amount, paymentMethod = 'card' } = req.body;
  if (!orderId || !amount) {
    return res.status(400).json({ message: 'Order ID and amount are required.' });
  }

  const payment = {
    id: demoStore.payments.length ? Math.max(...demoStore.payments.map((entry) => entry.id)) + 1 : 1,
    order_id: Number(orderId),
    user_id: req.user.id,
    amount: Number(amount),
    payment_method: paymentMethod,
    payment_status: 'paid',
    transaction_reference: `demo_txn_${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  demoStore.payments.push(payment);
  return res.status(201).json({ message: 'Payment recorded successfully.', payment });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: 'Internal server error.' });
});

if (pool) {
  pool.query('SELECT 1').then(() => console.log('Connected to PostgreSQL.')).catch((error) => console.error('PostgreSQL connection issue:', error.message));
}

app.listen(port, () => {
  console.log(`EarthGuard API running on http://localhost:${port}`);
});
