async function isRecipeExists(client, id) {
  const result = await client.query(
    'SELECT id, title FROM recipes WHERE id = $1 LIMIT 1',
    [id]
  );
  const recipe = result.rows[0];

  return {
    exists: !!recipe,
    data: recipe || null
  };
}

module.exports = { isRecipeExists };