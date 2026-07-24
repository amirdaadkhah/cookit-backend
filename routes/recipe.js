const router = require('express').Router();
const db = require('../config/db');
const { generateRecipeId } = require("../config/recipe-id");
const { isRecipeExists } = require("../config/recipe-existance");

// INSERT RECIPE endpoint
// only admin mode
router.post("/", async (req, res) => {
  const recipe = req.body;
  const client = await db.connect();
  console.log('✅ req is: ', req)
    console.log('✅ res is: ', res)

  try {
    await client.query("BEGIN");
    const recipeId = await generateRecipeId(client, recipe.category, recipe.diet);
    await upsertRecipe(client, recipe, recipeId);
    await replaceIngredients(client, recipeId, recipe.ingredients);
    //     if (recipe.subRecipes && recipe.subRecipes.length > 0) {
    if (recipe.subRecipes?.length) {
      await replaceSubRecipes(client, recipeId, recipe.subRecipes);
    }

    await client.query("COMMIT");

    res.json({ status: "ok - recipe was saved" });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });

  } finally {
    client.release();
  }
})

async function upsertRecipe(client, recipe, recipeId) {
  await client.query(
    `INSERT INTO recipes (
      id,title,category,vegan,vegetarian,is_warm,
      times,nutrition,steps,media,tags,origin,updated_at
    )
    VALUES ($1,$2,$3::jsonb,$4,$5,$6,
    $7::jsonb,$8::jsonb,$9::jsonb,$10::jsonb,$11::jsonb,$12,$13)
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      category = EXCLUDED.category,
      vegan = EXCLUDED.vegan,
      vegetarian = EXCLUDED.vegetarian,
      is_warm = EXCLUDED.is_warm,
      times = EXCLUDED.times,
      nutrition = EXCLUDED.nutrition,
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
      JSON.stringify(recipe.steps),
      JSON.stringify(recipe.media),
      JSON.stringify(recipe.tags),
      recipe.origin,
      recipe.updatedAt
    ]
  );
}

async function replaceIngredients(client, recipeId, ingredients = []) {
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


// CHWCK IF THIS RECIPE_ID EXISTS
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

module.exports = router;