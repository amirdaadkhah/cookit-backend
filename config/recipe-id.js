async function generateRecipeId(client, category, diet) {
    console.log('######### generateRecipeId called...');

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
  const padded = String(number).padStart(5, "0");
  const { veganCode, vegetarianCode } = getDietCodes(diet);

  return `${prefix}-${veganCode}-${vegetarianCode}-${padded}`;
}

function getDietCodes(diet) {
  const veganCode = diet.vegan ? "V" : "NV";
  const vegetarianCode = diet.vegetarian ? "VEG" : "NONVEG";
  console.log('######### diet code: ', { veganCode, vegetarianCode });
  return { veganCode, vegetarianCode };
}

async function getCategoryCode(client, categoryName) {
  console.log('######### cat name', categoryName);
  const result = await client.query(
    `SELECT code FROM category_codes WHERE name = $1`,
    [categoryName]
  );

  if (result.rows.length === 0) {
    throw new Error(`Unknown category: ${categoryName}`);
  }
  console.log('######### cat result', result.rows[0].code);

  return result.rows[0].code;
}

module.exports = { generateRecipeId };