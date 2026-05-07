require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is missing. Check your .env file.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// GET ALL SAVED TAGS
app.get("/tags", async (req, res) => {

  try {
      const result = await pool.query(
    "SELECT id, name FROM tags ORDER BY id"
  );
  res.json(result.rows);
  } catch (error) {
    console.error("Error loading tags: ", error);
    res.status(500).json({ error: "Failed to load tags" });
  }
});

// health check
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.LOCAL_PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});