require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require('./config/db')
const app = require('./app');

const recipeRoutes = require("./routes/recipe");

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is missing. Check your .env file.");
  process.exit(1);
}

const PORT = process.env.PORT || 6543;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server started on port: ${PORT}`);
});

// user mode 
// user with subscription mode
app.post('/recipes/search', async (req, res) => {

  try {
    const { ingredientIds, mode, limit } = req.body;

    if (!Array.isArray(ingredientIds) || ingredientIds.length === 0) {
      return res.status(400).json({ error: 'ingredientIds must be a non-empty array' });
    }
    console.log('BODY:', req.body);

    const query = `
      WITH user_ingredients AS (
        SELECT UNNEST($1::bigint[]) AS ingredient_id
      ),
      recipe_stats AS (
        SELECT
          r.id AS recipe_id,
          r.title,
          r.category,

          COUNT(DISTINCT CASE
            WHEN ui.ingredient_id IS NOT NULL AND i.is_common = false
            THEN ri.ingredient_id
          END) AS match_count,

          COUNT(DISTINCT CASE
            WHEN ui.ingredient_id IS NOT NULL
             AND ri.is_main = true
             AND i.is_common = false
            THEN ri.ingredient_id
          END) AS main_match_count,

          COUNT(DISTINCT CASE
            WHEN ui.ingredient_id IS NULL AND i.is_common = false
            THEN ri.ingredient_id
          END) AS missing_count

        FROM recipes r
        JOIN recipe_ingredients ri ON ri.recipe_id = r.id
        JOIN ingredients i ON i.id = ri.ingredient_id
        LEFT JOIN user_ingredients ui ON ui.ingredient_id = ri.ingredient_id
        GROUP BY r.id, r.title, r.category
      )
      SELECT *,
             (3 * main_match_count) + match_count - (0.5 * missing_count) AS score
      FROM recipe_stats
      WHERE match_count > 0
      ORDER BY score DESC, match_count DESC
      LIMIT $2
    `;

    const result = await db.query(query, [ingredientIds, limit]);

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
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

// GET ALL SAVED TAGS
// public
app.get("/api/tags", async (req, res) => {
  try {
    const result = await db.query(
    "SELECT id, name FROM tags ORDER BY id;"
  );
  res.json(result.rows);
  } catch (error) {
    console.error("Error loading tags: ", error);
    res.status(500).json({ error: "Failed to load tags" });
  }
});

// only admin mode
app.post("/api/tags/add", async (req, res) => {
  const { tags } = req.body; // array of string - tags

  if (!Array.isArray(tags)) {
    return res.status(400).json({ error: "Body must be an array of strings" });
  }
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    for(const tag of tags) {
      if (typeof tag !== "string") continue;
      const normilizedTag = tag.trim().toLowerCase().replace(/\s+/g, "_");
      if(!normilizedTag) continue;

      await client.query(
        `
        INSERT INTO tags (name)
        VALUES ($1)
        ON CONFLICT (name) DO NOTHING
        `,
        [normilizedTag]
      );
    }

    await client.query("COMMIT");
    res.json({ status: "ok" });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });

  } finally {
    client.release();
  }
});

// health check
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/", (req, res) => {
  res.send("Server is running");
});
