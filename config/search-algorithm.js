
async function search(ingredientIds, mode, limit) {
  if (!Array.isArray(ingredientIds) || ingredientIds.length === 0) {
    throw new Error('ingredientIds must be a non-empty array');
  }

  const searchUrl = process.env.SEARCH_API_URL;

  if (!searchUrl) {
    throw new Error('SEARCH_API_URL environment variable is not defined');
  }

  const response = await fetch(
    `${searchUrl}/search`,
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

  const responseText = await response.text();

  console.log('Search API status:', response.status);
  console.log('Search API response:', responseText);

  if (!response.ok) {
    throw new Error(
      `Search API failed: ${response.status} - ${responseText}`
    );
  }

  return JSON.parse(responseText);
};

module.exports = { search };