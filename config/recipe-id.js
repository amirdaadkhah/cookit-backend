async function generateRecipeId(client, category, diet) {
  const prefix = await getCategoryCode(client, category);

  const result = await client.query(
    `
    INSERT INTO recipe_id_counter(category_code, last_number)
    VALUES ($1, 1)
    ON CONFLICT (category_code)
    DO UPDATE SET last_number = recipe_id_counter.last_number + 1
    RETURNING last_number
    `,
    [prefix]
  );

  const number = result.rows[0].last_number;
  const padded = String(number).padStart(4, "0");
  const { veganCode, vegetarianCode } = getDietCodes(diet);

  return `${prefix}-${veganCode}-${vegetarianCode}-${padded}`;
}

function getDietCodes(diet) {
  const veganCode = diet.vegan ? "V" : "NV";
  const vegetarianCode = diet.vegetarian ? "VEG" : "NONVEG";
  return { veganCode, vegetarianCode };
}

async function getCategoryCode(client, categoryNames) {
  console.log('######### cat name', categoryNames);
  const result = await client.query(
    `SELECT name, code FROM category_codes WHERE name = ANY($1)`,
    [categoryNames]
  );

  if (result.rows.length !== categoryNames.length) { // validate if all categories exist
    const found = result.rows.map(r => r.name);
    const missing = categoryNames.filter(n => !found.includes(n));
    throw new Error(`Unknown category -(ies): ${missing.join(", ")}`);
  }
  const map = new Map(result.rows.map(r => [r.name, r.code]));
  const prefix = categoryNames.map(name => map.get(name)).join("");
  return prefix;
}

module.exports = { generateRecipeId };