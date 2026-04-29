const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   FILE PATHS
========================= */
const USERS_PATH = "./data/users.json";
const RESTAURANTS_PATH = "./data/restaurants.json";
const ITEMS_PATH = "./data/items.json";
const CARTS_PATH = "./data/carts.json";
const ORDERS_PATH = "./data/orders.json";

/* =========================
   FILE HELPERS
========================= */
const readData = (path) => {
  if (!fs.existsSync(path)) return [];
  return JSON.parse(fs.readFileSync(path));
};

const writeData = (path, data) => {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
};

/* =========================
   AUTH (Dummy)
========================= */

// Register
app.post("/api/auth/register", (req, res) => {
  const users = readData(USERS_PATH);

  const user = {
    userID: Date.now(),
    username: req.body.username,
    password: req.body.password,
  };

  users.push(user);
  writeData(USERS_PATH, users);

  res.json(user);
});

// Login
app.post("/api/auth/login", (req, res) => {
  const users = readData(USERS_PATH);

  const user = users.find(
    (u) =>
      u.username === req.body.username &&
      u.password === req.body.password
  );

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  res.json(user);
});

/* =========================
   RESTAURANTS (GET)
========================= */

app.get("/api/restaurants", (req, res) => {
  const data = readData(RESTAURANTS_PATH);
  res.json(data);
});

app.get("/api/restaurants/:id", (req, res) => {
  const data = readData(RESTAURANTS_PATH);
  const r = data.find((r) => r.restaurantID == req.params.id);
  res.json(r || {});
});

/* =========================
   ITEMS (GET)
========================= */

app.get("/api/items", (req, res) => {
  const data = readData(ITEMS_PATH);
  res.json(data);
});

app.get("/api/items/:id", (req, res) => {
  const data = readData(ITEMS_PATH);
  const item = data.find((i) => i.itemID == req.params.id);
  res.json(item || {});
});

app.get("/api/items/restaurant/:restaurantID", (req, res) => {
  const data = readData(ITEMS_PATH);
  const filtered = data.filter(
    (i) => i.restaurantID == req.params.restaurantID
  );
  res.json(filtered);
});

/* =========================
   CART (CRUD)
========================= */

// Get Cart
app.get("/api/cart/:userID", (req, res) => {
  const carts = readData(CARTS_PATH);
  const cart = carts.find((c) => c.userID == req.params.userID);
  res.json(cart || { userID: req.params.userID, items: {} });
});

// Add/Update Item
app.post("/api/cart/:userID", (req, res) => {
  let carts = readData(CARTS_PATH);
  let cart = carts.find((c) => c.userID == req.params.userID);

  if (!cart) {
    cart = { userID: req.params.userID, items: {} };
    carts.push(cart);
  }

  const { itemID, quantity } = req.body;
  cart.items[itemID] = quantity;

  writeData(CARTS_PATH, carts);
  res.json(cart);
});

// Delete Item
app.delete("/api/cart/:userID/:itemID", (req, res) => {
  let carts = readData(CARTS_PATH);
  let cart = carts.find((c) => c.userID == req.params.userID);

  if (cart) {
    delete cart.items[req.params.itemID];
  }

  writeData(CARTS_PATH, carts);
  res.json({ success: true });
});

// Clear Cart
app.delete("/api/cart/:userID", (req, res) => {
  let carts = readData(CARTS_PATH);
  carts = carts.map((c) =>
    c.userID == req.params.userID ? { ...c, items: {} } : c
  );

  writeData(CARTS_PATH, carts);
  res.json({ success: true });
});

/* =========================
   ORDERS (CRUD + LOGIC)
========================= */

// Create Order
app.post("/api/orders", (req, res) => {
  const orders = readData(ORDERS_PATH);

  const order = {
    orderID: Date.now(),
    userID: req.body.userID,
    orderItems: req.body.orderItems,
    orderStatus: "PENDING",
    createdAt: Date.now(),
  };

  orders.push(order);
  writeData(ORDERS_PATH, orders);

  // Auto-complete after 1 min
  setTimeout(() => {
    let updatedOrders = readData(ORDERS_PATH);
    const o = updatedOrders.find((o) => o.orderID === order.orderID);

    if (o && o.orderStatus === "PENDING") {
      o.orderStatus = "COMPLETED";
      writeData(ORDERS_PATH, updatedOrders);
    }
  }, 60000);

  res.json(order);
});

// Get All Orders
app.get("/api/orders", (req, res) => {
  const orders = readData(ORDERS_PATH);
  res.json(orders);
});

// Get User Orders
app.get("/api/orders/user/:userID", (req, res) => {
  const orders = readData(ORDERS_PATH);
  const filtered = orders.filter(
    (o) => o.userID == req.params.userID
  );
  res.json(filtered);
});

// Cancel Order
app.delete("/api/orders/:orderID", (req, res) => {
  let orders = readData(ORDERS_PATH);

  const order = orders.find((o) => o.orderID == req.params.orderID);

  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  if (order.orderStatus === "COMPLETED") {
    return res
      .status(400)
      .json({ message: "Cannot cancel completed order" });
  }

  orders = orders.filter((o) => o.orderID != req.params.orderID);
  writeData(ORDERS_PATH, orders);

  res.json({ success: true });
});

/* =========================
   SERVER
========================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});