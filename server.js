const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const jwtSecret = process.env.JWT_SECRET || 'earthguard-dev-secret';

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
  ],
  products: [
    {
      id: 1,
      name: 'Eco Starter Kit',
      description: 'A beginner-friendly package for low-waste living.',
      category: 'Home',
      price: 29.99,
      stock: 25,
      is_active: true,
      created_by_user_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  services: [
    {
      id: 1,
      name: 'Carbon Audit',
      description: 'Carbon footprint review and sustainability action plan.',
      price: 149.0,
      duration_days: 14,
      is_active: true,
      created_by_user_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  orders: [
    {
      id: 1,
      customer_id: 1,
      user_id: 1,
      status: 'paid',
      total_amount: 179.99,
      currency: 'USD',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  order_items: [
    {
      id: 1,
      order_id: 1,
      product_id: 1,
      service_id: null,
      quantity: 1,
      unit_price: 29.99,
      subtotal: 29.99,
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      order_id: 1,
      service_id: 1,
      product_id: null,
      quantity: 1,
      unit_price: 149.0,
      subtotal: 149.0,
      created_at: new Date().toISOString(),
    },
  ],
  payments: [
    {
      id: 1,
      order_id: 1,
      user_id: 1,
      amount: 179.99,
      payment_method: 'card',
      payment_status: 'paid',
      transaction_reference: 'demo_txn_1001',
      created_at: new Date().toISOString(),
    },
  ],
  messages: [
    {
      id: 1,
      sender_user_id: 1,
      receiver_user_id: 1,
      subject: 'Welcome to EarthGuard',
      body: 'Welcome to the EarthGuard community. Let’s protect the planet together.',
      is_read: false,
      created_at: new Date().toISOString(),
    },
  ],
  ownership: [
    {
      id: 1,
      user_id: 1,
      resource_type: 'user',
      resource_id: 1,
      permission_level: 'owner',
      granted_at: new Date().toISOString(),
    },
  ],
};

const appRoot = path.join(__dirname);

function getDb() {
  return pool;
}

function buildToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, jwtSecret, {
    expiresIn: '7d',
  });
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

function ensureUserOwnership(req, resourceType, resourceId) {
  const ownerRecords = demoStore.ownership.filter(
    (entry) =>
      entry.user_id === req.user.id &&
      entry.resource_type === resourceType &&
      Number(entry.resource_id) === Number(resourceId)
  );

  if (req.user.role !== 'admin' && ownerRecords.length === 0) {
    return false;
  }

  return true;
}

const publicRoutes = ['/', '/index.html'];
publicRoutes.forEach((route) => {
  app.get(route, (req, res) => {
    res.sendFile(path.join(appRoot, 'index.html'));
  });
});

app.use(express.static(appRoot));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: pool ? 'connected' : 'demo-mode',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, fullName, role = 'customer' } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const trimmedEmail = String(email).trim().toLowerCase();
  const existingUser = demoStore.users.find((user) => user.email === trimmedEmail);

  if (existingUser) {
    return res.status(409).json({ message: 'User already exists.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const userId = demoStore.users.length ? Math.max(...demoStore.users.map((user) => user.id)) + 1 : 1;
  const newUser = {
    id: userId,
    email: trimmedEmail,
    password_hash: passwordHash,
    role,
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  demoStore.users.push(newUser);

  const customerRecord = {
    id: demoStore.customers.length ? Math.max(...demoStore.customers.map((customer) => customer.id)) + 1 : 1,
    user_id: userId,
    full_name: fullName || 'New Customer',
    phone: '',
    address: '',
    city: '',
    country: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  demoStore.customers.push(customerRecord);
  demoStore.ownership.push({
    id: demoStore.ownership.length ? Math.max(...demoStore.ownership.map((entry) => entry.id)) + 1 : 1,
    user_id: userId,
    resource_type: 'user',
    resource_id: userId,
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
  const user = demoStore.users.find((entry) => entry.id === req.user.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  return res.json({
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  });
});

app.get('/api/customers', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    const customer = demoStore.customers.find((entry) => entry.user_id === req.user.id);
    return res.json(customer ? [customer] : []);
  }

  return res.json(demoStore.customers);
});

app.get('/api/products', authMiddleware, (req, res) => {
  return res.json(demoStore.products);
});

app.get('/api/services', authMiddleware, (req, res) => {
  return res.json(demoStore.services);
});

app.get('/api/orders', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.json(demoStore.orders.filter((entry) => entry.user_id === req.user.id));
  }

  return res.json(demoStore.orders);
});

app.post('/api/orders', authMiddleware, (req, res) => {
  const { customerId, items = [], totalAmount = 0, currency = 'USD' } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Order items are required.' });
  }

  const customer = demoStore.customers.find((entry) => Number(entry.id) === Number(customerId));

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found.' });
  }

  const orderId = demoStore.orders.length ? Math.max(...demoStore.orders.map((order) => order.id)) + 1 : 1;
  const order = {
    id: orderId,
    customer_id: customer.id,
    user_id: req.user.id,
    status: 'pending',
    total_amount: Number(totalAmount) || 0,
    currency,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  demoStore.orders.push(order);
  demoStore.ownership.push({
    id: demoStore.ownership.length ? Math.max(...demoStore.ownership.map((entry) => entry.id)) + 1 : 1,
    user_id: req.user.id,
    resource_type: 'order',
    resource_id: orderId,
    permission_level: 'owner',
    granted_at: new Date().toISOString(),
  });

  const createdItems = items.map((item) => ({
    id: demoStore.order_items.length ? Math.max(...demoStore.order_items.map((entry) => entry.id)) + 1 : 1,
    order_id: orderId,
    product_id: item.productId || null,
    service_id: item.serviceId || null,
    quantity: item.quantity || 1,
    unit_price: item.unitPrice || 0,
    subtotal: item.subtotal || 0,
    created_at: new Date().toISOString(),
  }));

  demoStore.order_items.push(...createdItems);

  return res.status(201).json({ message: 'Order created successfully.', order });
});

app.get('/api/messages', authMiddleware, (req, res) => {
  const messages = demoStore.messages.filter(
    (entry) => entry.sender_user_id === req.user.id || entry.receiver_user_id === req.user.id
  );

  return res.json(messages);
});

app.post('/api/messages', authMiddleware, (req, res) => {
  const { receiverUserId, subject, body } = req.body;

  if (!receiverUserId || !body) {
    return res.status(400).json({ message: 'Receiver and message body are required.' });
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

app.get('/api/payments', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.json(demoStore.payments.filter((entry) => entry.user_id === req.user.id));
  }

  return res.json(demoStore.payments);
});

app.post('/api/payments', authMiddleware, (req, res) => {
  const { orderId, amount, paymentMethod = 'card', transactionReference = 'demo_reference' } = req.body;

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
    transaction_reference: transactionReference,
    created_at: new Date().toISOString(),
  };

  demoStore.payments.push(payment);
  return res.status(201).json({ message: 'Payment recorded successfully.', payment });
});

app.get('/api/dashboard', authMiddleware, (req, res) => {
  const totals = {
    users: demoStore.users.length,
    customers: demoStore.customers.length,
    orders: demoStore.orders.length,
    payments: demoStore.payments.length,
    products: demoStore.products.length,
    services: demoStore.services.length,
    messages: demoStore.messages.length,
  };

  return res.json({ totals });
});

app.use((error, req, res, next) => {
  console.error(error);
  return res.status(500).json({ message: 'Internal server error' });
});

if (pool) {
  pool
    .query('SELECT 1')
    .then(() => {
      console.log('Connected to PostgreSQL.');
    })
    .catch((error) => {
      console.error('PostgreSQL connection error:', error.message);
    });
}

app.listen(port, () => {
  console.log(`EarthGuard app running on http://localhost:${port}`);
});
