const router = require('express').Router();
const db = require('../config/db');
const { generateRecipeId } = require("../config/recipe-id");
const { isRecipeExists } = require("../config/recipe-existance");

// INSERT RECIPE endpoint
// only admin mode
router.post("/", async (req, res) => {
  const recipe = req.body;
  const client = await db.connect();
  console.log('######## POST called!');
  try {
    await client.query("BEGIN");
    const recipeId = await generateRecipeId(client, recipe.category, recipe.diet);
    await upsertRecipe(client, recipe, recipeId);
    await replaceIngredients(client, recipeId, recipe.ingredients);

    if (recipe.subRecipes?.length) {
      await replaceSubRecipes(client, recipeId, recipe.subRecipes);
    }

    await client.query("COMMIT");
  console.log('######## POST called, RESPONCE received-------------------!');

    res.json({ status: "ok - recipe was saved" });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });

  } finally {
    client.release();
  }
})

async function upsertRecipe(client, recipe, recipeId) {
  console.log('######## upsertRecipe called!');

  await client.query(
    `INSERT INTO recipes (
      id,title,category,vegan,vegetarian,is_warm,
      times,nutrition,servings,steps,media,tags,origin,updated_at
    )
    VALUES ($1,$2,$3::jsonb,$4,$5,$6,
    $7::jsonb,$8,$9::jsonb,$10::jsonb,$11::jsonb,$12::jsonb,$13,$14)
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      category = EXCLUDED.category,
      vegan = EXCLUDED.vegan,
      vegetarian = EXCLUDED.vegetarian,
      is_warm = EXCLUDED.is_warm,
      times = EXCLUDED.times,
      nutrition = EXCLUDED.nutrition,
      servings = EXCLUDED.servings,
      steps = EXCLUDED.steps,
      media = EXCLUDED.media,
      tags = EXCLUDED.tags,
      origin = EXCLUDED.origin,
      updated_at = EXCLUDED.updated_at
    `,
    [
      recipeId,
      recipe.title,
      JSON.stringify(recipe.category),
      recipe.diet.vegan,
      recipe.diet.vegetarian,
      recipe.isWarm,
      JSON.stringify(recipe.times),
      JSON.stringify(recipe.nutrition),
      recipe.servings,
      JSON.stringify(recipe.steps),
      JSON.stringify(recipe.media),
      JSON.stringify(recipe.tags),
      recipe.origin,
      recipe.updatedAt
    ]
  );
}

async function replaceIngredients(client, recipeId, ingredients = []) {
  console.log('######## replaceIngredients called!');

  await client.query(
    `DELETE FROM recipe_ingredients WHERE recipe_id = $1`,
    [recipeId]
  );

  for (const ing of ingredients) {
    await client.query(
      `INSERT INTO recipe_ingredients
      (recipe_id,ingredient_id,is_main,optional,qty,unit,note,subtitute)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      `,
      [
        recipeId,
        ing.ingredientId,
        ing.isMain,
        ing.optional,
        ing.qty,
        ing.unit,
        ing.note,
        ing.subtitute
      ]
    );
  }
}

async function replaceSubRecipes(client, recipeId, subRecipes = []) {
  console.log('######## replaceSubRecipes called!');

  await client.query(
    `DELETE FROM sub_recipes WHERE parent_recipe_id = $1`,
    [recipeId]
  );

  for (const sub of subRecipes) {
    await client.query(
      `INSERT INTO sub_recipes
      (parent_recipe_id, sub_recipe_id, sub_qty, sub_unit, sub_note)
      VALUES ($1,$2,$3,$4,$5)
      `,
      [
        recipeId,
        sub.subRecipeId,
        sub.qty,
        sub.unit,
        sub.note
      ]
    );
  }
}

// CHECK IF THIS RECIPE_ID EXISTS
router.post("/exists", async (req, res) => {
  const { id } = req.body;
  const client = await db.connect();

  try {
    const exists = await isRecipeExists(client, id);
    return res.json(exists);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ exists: false });
  } finally {
    client.release();
  }
});

// GET SINGLE RECIPE by RECIPE_ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [recipeResult, ingredientsResult] = await Promise.all([
      db.query(
        "SELECT * FROM recipes WHERE id = $1;",
        [id]
      ),

      db.query(
        `
        SELECT
          recipe_id AS "recipeId",
          ingredient_id AS "ingredientId",
          qty,
          unit
        FROM recipe_ingredients
        WHERE recipe_id = $1;
        `,
        [id]
      )
    ]);

    if (recipeResult.rows.length === 0) {
      return res.status(404).json({
        message: 'Recipe not found'
      });
    }

    return res.json({
      ...recipeResult.rows[0],
      ingredients: ingredientsResult.rows
    });

  } catch (error) {
    console.error("Error loading recipe by id: ", id, error);
    res.status(500).json({ error: "Failed to load recipe" });
  }
});

module.exports = router;