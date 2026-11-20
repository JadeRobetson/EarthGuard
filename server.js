require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const jwtSecret = process.env.JWT_SECRET || 'earthguard-dev-secret';

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  credentials: true,
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

app.use('/api', apiLimiter);

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

const buildToken = (user) => jwt.sign({ id: user.id, email: user.email, role: user.role }, jwtSecret, { expiresIn: '1h' });

const getUserById = (userId) => demoStore.users.find((user) => Number(user.id) === Number(userId));

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, jwtSecret);
    const currentUser = getUserById(decoded.id);
    if (
      !currentUser ||
      currentUser.status !== 'active' ||
      currentUser.email !== String(decoded.email || '').trim().toLowerCase()
    ) {
      return res.status(401).json({ message: 'Invalid or expired session.' });
    }

    req.user = {
      id: currentUser.id,
      email: currentUser.email,
      role: currentUser.role,
    };
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: pool ? 'postgres' : 'demo-mode', time: new Date().toISOString() });
});

app.post('/api/auth/register', authLimiter, async (req, res) => {
  const { email, password, fullName } = req.body;

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  if (password.length < 8 || password.length > 128) {
    return res.status(400).json({ message: 'Password must be between 8 and 128 characters.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const existingUser = demoStore.users.find((user) => user.email === normalizedEmail);
  if (existingUser) {
    return res.status(400).json({ message: 'Registration could not be completed.' });
  }

  const newUserId = demoStore.users.length ? Math.max(...demoStore.users.map((user) => user.id)) + 1 : 1;
  let passwordHash;
  try {
    passwordHash = bcrypt.hashSync(password, 10);
  } catch (error) {
    return res.status(400).json({ message: 'Invalid password.' });
  }

  const newUser = {
    id: newUserId,
    email: normalizedEmail,
    password_hash: passwordHash,
    role: 'customer',
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

app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (typeof email !== 'string' || typeof password !== 'string') {
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
  const isAdmin = req.user.role === 'admin';
  const visibleOrders = isAdmin
    ? demoStore.orders
    : demoStore.orders.filter((order) => Number(order.user_id) === Number(req.user.id));
  const visiblePayments = isAdmin
    ? demoStore.payments
    : demoStore.payments.filter((payment) => Number(payment.user_id) === Number(req.user.id));
  const visibleMessages = demoStore.messages.filter(
    (message) => isAdmin ||
      Number(message.sender_user_id) === Number(req.user.id) ||
      Number(message.receiver_user_id) === Number(req.user.id)
  );

  const baseResponse = {
    metrics: {
      users: isAdmin ? demoStore.users.length : 1,
      customers: isAdmin ? demoStore.customers.length : 1,
      orders: visibleOrders.length,
      payments: visiblePayments.length,
      products: demoStore.products.length,
      services: demoStore.services.length,
      messages: visibleMessages.length,
    },
    products: demoStore.products,
    services: demoStore.services,
    orders: visibleOrders,
    recentMessages: visibleMessages.slice(-3).reverse(),
    user: (() => {
      const user = getUserById(req.user.id);
      return user ? { id: user.id, email: user.email, role: user.role, status: user.status, created_at: user.created_at } : null;
    })(),
  };

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
  const { items = [], currency = 'USD' } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Order items are required.' });
  }

  if (!['USD'].includes(currency)) {
    return res.status(400).json({ message: 'Unsupported currency.' });
  }

  const customer = demoStore.customers.find((entry) => Number(entry.user_id) === Number(req.user.id));
  if (!customer) {
    return res.status(400).json({ message: 'Customer profile is required.' });
  }

  const calculatedItems = [];
  let totalAmount = 0;

  for (const item of items) {
    const quantity = Number(item?.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      return res.status(400).json({ message: 'Invalid item quantity.' });
    }

    let catalogItem;
    let productId = null;
    let serviceId = null;

    if (item.productId !== undefined) {
      productId = Number(item.productId);
      catalogItem = demoStore.products.find((entry) =>
        Number(entry.id) === productId && entry.is_active
      );
    } else if (item.serviceId !== undefined) {
      serviceId = Number(item.serviceId);
      catalogItem = demoStore.services.find((entry) =>
        Number(entry.id) === serviceId && entry.is_active
      );
    }

    if (!catalogItem) {
      return res.status(400).json({ message: 'One or more order items are invalid.' });
    }

    const unitPrice = Number(catalogItem.price);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      return res.status(400).json({ message: 'Invalid catalog price.' });
    }

    const subtotal = Math.round(unitPrice * quantity * 100) / 100;
    totalAmount += subtotal;
    calculatedItems.push({ productId, serviceId, quantity, unitPrice, subtotal });
  }

  totalAmount = Math.round(totalAmount * 100) / 100;
  const order = {
    id: demoStore.orders.length ? Math.max(...demoStore.orders.map((entry) => entry.id)) + 1 : 1,
    customer_id: customer.id,
    user_id: req.user.id,
    status: 'pending',
    total_amount: totalAmount,
    currency,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  demoStore.orders.push(order);
  for (const item of calculatedItems) {
    demoStore.order_items.push({
      id: demoStore.order_items.length ? Math.max(...demoStore.order_items.map((entry) => entry.id)) + 1 : 1,
      order_id: order.id,
      product_id: item.productId,
      service_id: item.serviceId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      subtotal: item.subtotal,
      created_at: new Date().toISOString(),
    });
  }
  return res.status(201).json({ message: 'Order created.', order });
});

app.get('/api/payments', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.json(demoStore.payments.filter((payment) => Number(payment.user_id) === Number(req.user.id)));
  }
  return res.json(demoStore.payments);
});

app.post('/api/payments', authMiddleware, (req, res) => {
  const { orderId, paymentMethod = 'card' } = req.body;
  if (!orderId) {
    return res.status(400).json({ message: 'Order ID is required.' });
  }

  const order = demoStore.orders.find((entry) => Number(entry.id) === Number(orderId));
  if (!order) {
    return res.status(404).json({ message: 'Order not found.' });
  }
  if (req.user.role !== 'admin' && Number(order.user_id) !== Number(req.user.id)) {
    return res.status(403).json({ message: 'You cannot create a payment for this order.' });
  }

  if (typeof paymentMethod !== 'string' || !['card', 'bank'].includes(paymentMethod)) {
    return res.status(400).json({ message: 'Invalid payment method.' });
  }

  const payment = {
    id: demoStore.payments.length ? Math.max(...demoStore.payments.map((entry) => entry.id)) + 1 : 1,
    order_id: order.id,
    user_id: order.user_id,
    amount: Number(order.total_amount),
    payment_method: paymentMethod,
    payment_status: 'pending',
    transaction_reference: null,
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
