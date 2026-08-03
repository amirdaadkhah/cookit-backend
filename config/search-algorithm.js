
async function search(ingredientIds, mode, limit) {
  if (!Array.isArray(ingredientIds) || ingredientIds.length === 0) {
    throw new Error('ingredientIds must be a non-empty array');
  }

  const response = await fetch(
    `${process.env.SEARCH_API_URL}/search`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.SEARCH_API_KEY,
      },
      body: JSON.stringify({
        ingredientIds, mode, limit
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Search API failed: ${response.status}`);
  }
  const data = await response.json();
  return data;
};

module.exports = { search };