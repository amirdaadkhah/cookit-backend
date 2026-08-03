require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require('./config/db')
const app = require('./app');

const recipeRoutes = require("./routes/recipe");
const tagsRoutes = require("./routes/tags");

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is missing. Check your .env file.");
  process.exit(1);
}

const PORT = process.env.PORT || 6543;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server started on port: ${PORT}`);
});

// TEST endpoint - temporary
app.get("/ingredients", async (req, res) => {
  const result = await db.query(
    "SELECT id, name, category FROM ingredients ORDER BY name"
  );
  res.json(result.rows);
});

app.get('/ping', (req, res) => {
  console.log('PING HIT on port:', process.env.DATABASE_URL);
  res.json({ ok: true, source: 'backend server.js' });
});

// Routes 
// INSERT RECIPE endpoint
app.use("/api/add/recipe", recipeRoutes);
// CHECK RECIPE endpoint
app.use("/api/recipe", recipeRoutes);

// GET ALL SAVED TAGS
// public
app.use("/api/tags", tagsRoutes);

// only admin mode
// ADD tags to DB
app.use("/api/tags/add", tagsRoutes);

// health check
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/", (req, res) => {
  res.send("Server is running");
});