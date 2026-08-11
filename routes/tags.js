const router = require('express').Router();
const db = require('../config/db');

// only admin mode
// add tags to db
router.post("/", async (req, res) => {
  const { tags } = req.body; // array of string - tags

  if (!Array.isArray(tags)) {
    return res.status(400).json({ error: "Body must be an array of strings" });
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    for (const tag of tags) {
      if (typeof tag !== "string") continue;
      const normilizedTag = tag.trim().toLowerCase().replace(/\s+/g, "_");
      if (!normilizedTag) continue;

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

// GET ALL SAVED TAGS
router.get("/", async (req, res) => {
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

module.exports = router;