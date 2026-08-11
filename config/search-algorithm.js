
const sleep = (ms) =>
  new Promise(resolve => setTimeout(resolve, ms));

async function search(ingredientIds, mode, limit) {
  if (!Array.isArray(ingredientIds) || ingredientIds.length === 0) {
    throw new Error('ingredientIds must be a non-empty array');
  }

  const searchUrl = process.env.SEARCH_API_URL;

  if (!searchUrl) {
    throw new Error('SEARCH_API_URL environment variable is not defined');
  }

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`Search API attempt ${attempt}`);

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
          signal: AbortSignal.timeout(90000)
        }
      );

      const responseText = await response.text();

      console.log('Search API status:', response.status);
      console.log('Search API response:', responseText);
      if (response.ok) {
        return JSON.parse(responseText);

      }
      console.error(`Search API failed: ${response.status} - ${responseText}`);

    } catch (error) {
      console.error(
        `Search API attempt ${attempt} failed:`,
        error.message
      );

      if (attempt === maxAttempts) {
        throw error;
      }
    }

    // Give sleeping Render service time to wake up
    await sleep(5000 * attempt);
  }

  throw new Error('Search API unavailable');
};

module.exports = { search };