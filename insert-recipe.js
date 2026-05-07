// require("dotenv").config();
// const { Pool } = require("pg");

// if (!process.env.DATABASE_URL) {
//   console.error("❌ DATABASE_URL is missing. Check your .env file.");
//   process.exit(1);
// }

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: { rejectUnauthorized: false },
// });

// // ---- SAMPLE DATA ----

// const recipe = {
//   id: "SG-TEST-0001", // you can change to a ULID/UUID later; for now any unique text is fine
//   title: "Za'atar Spice Blend (Test Insert)",
//   category: ["seasoning"],
//   vegan: true,
//   vegetarian: true,
//   prep_min: 5,
//   cook_min: 1,
//   total_min: 6,
//   kcal: 0,
//   steps: [
//     "Roast sesame.",
//     "Roast coriander seeds and cumin.",
//     "Blend all ingredients.",
//     "Store in a dry, cool place.",
//   ],
//   media: { youtube: "https://youtu.be/dKAMVfHy0ug" },
//   updated_at: "2025-01-02",
//   ingredients: [
//     { ingredient_id: 10011, is_main: true, optional: false, qty: 1, unit: "tbsp", note: "roasted" },
//     { ingredient_id: 7030,  is_main: true, optional: false, qty: 1, unit: "tbsp", note: "roasted" },
//     { ingredient_id: 7028,  is_main: true, optional: false, qty: 1, unit: "tbsp", note: "roasted" },
//     { ingredient_id: 7020,  is_main: true, optional: false, qty: 1, unit: "tbsp", note: null },
//     { ingredient_id: 7013,  is_main: true, optional: false, qty: 1, unit: "tbsp", note: null },
//     { ingredient_id: 7002,  is_main: false, optional: false, qty: 0.5, unit: "tsp", note: null },
//     { ingredient_id: 7027,  is_main: false, optional: false, qty: 0.33, unit: "tsp", note: null },
//   ],
// };
// // -------------------------------

// async function main() {
//   const client = await pool.connect();

//   try {
//     await client.query("BEGIN");

//     // 1) Ensure referenced ingredients exist (avoids FK failures)
//     const ids = recipe.ingredients.map((x) => x.ingredient_id);
//     const check = await client.query(
//       'SELECT id FROM ingredients WHERE id = ANY($1::bigint[])',
//       [ids]
//     );
//     const existing = new Set(check.rows.map((r) => Number(r.id)));
//     const missing = ids.filter((id) => !existing.has(Number(id)));

//     if (missing.length > 0) {
//       throw new Error(
//         `Missing ingredient IDs in ingredients table: ${missing.join(", ")}. Insert them first into ingredients.`
//       );

//     }
//      // 2) Upsert into recipes
//     await client.query(
//       `
//       INSERT INTO recipes (
//         id, title, category, vegan, vegetarian,
//         prep_min, cook_min, total_min, kcal,
//         steps, media, updated_at
//       )
//       VALUES (
//         $1,$2,$3,$4,$5,
//         $6,$7,$8,$9,
//         $10::jsonb,$11::jsonb,$12
//       )
//       ON CONFLICT (id) DO UPDATE SET
//         title = EXCLUDED.title,
//         category = EXCLUDED.category,
//         vegan = EXCLUDED.vegan,
//         vegetarian = EXCLUDED.vegetarian,
//         prep_min = EXCLUDED.prep_min,
//         cook_min = EXCLUDED.cook_min,
//         total_min = EXCLUDED.total_min,
//         kcal = EXCLUDED.kcal,
//         steps = EXCLUDED.steps,
//         media = EXCLUDED.media,
//         updated_at = EXCLUDED.updated_at
//       `,
//       [
//         recipe.id,
//         recipe.title,
//         recipe.category,
//         recipe.vegan,
//         recipe.vegetarian,
//         recipe.prep_min,
//         recipe.cook_min,
//         recipe.total_min,
//         recipe.kcal,
//         JSON.stringify(recipe.steps),
//         JSON.stringify(recipe.media),
//         recipe.updated_at,
//       ]
//     );

//     // 3) Upsert into recipe_ingredients (prevents duplicates via PK)
//     for (const ing of recipe.ingredients) {
//       await client.query(
//         `
//         INSERT INTO recipe_ingredients (
//           recipe_id, ingredient_id, is_main, optional, qty, unit, note
//         )
//         VALUES ($1,$2,$3,$4,$5,$6,$7)
//         ON CONFLICT (recipe_id, ingredient_id) DO UPDATE SET
//           is_main = EXCLUDED.is_main,
//           optional = EXCLUDED.optional,
//           qty = EXCLUDED.qty,
//           unit = EXCLUDED.unit,
//           note = EXCLUDED.note
//         `,
//         [
//           recipe.id,
//           ing.ingredient_id,
//           ing.is_main,
//           ing.optional,
//           ing.qty,
//           ing.unit,
//           ing.note,
//         ]
//       );
//     }

//     await client.query("COMMIT");

//     // 4) Confirm insert
//     const confirm = await client.query(
//       `SELECT r.id, r.title, COUNT(ri.ingredient_id) AS ingredient_count
//        FROM recipes r
//        LEFT JOIN recipe_ingredients ri ON ri.recipe_id = r.id
//        WHERE r.id = $1
//        GROUP BY r.id, r.title`,
//       [recipe.id]
//     );

//     console.log("✅ Insert/Update successful:");
//     console.log(confirm.rows[0]);
//   } catch (err) {
//     await client.query("ROLLBACK");
//     console.error("❌ Insert failed:");
//     console.error(err.message || err);
//     process.exitCode = 1;
//   } finally {
//     client.release();
//     await pool.end();
//   }
// }

// main();