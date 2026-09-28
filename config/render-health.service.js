const sleep = (ms) =>
  new Promise(resolve => setTimeout(resolve, ms));

async function wakeSearchApi(searchUrl) {
  const maxAttempts = 3;
  const searchUrl = process.env.SEARCH_API_URL;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(
        `Health check attempt ${attempt}/${maxAttempts}`
      );

      const response = await fetch(
        `${searchUrl}/health`,
        {
          method: 'GET',
          signal: AbortSignal.timeout(70000)
        }
      );

      console.log(
        `Health check status: ${response.status}`
      );

      if (response.ok) {
        console.log('Search API is ready ✅');
        return;
      }

    } catch (error) {
      console.warn(
        `Health check attempt ${attempt} failed:`,
        error.message
      );
    }

    if (attempt < maxAttempts) {
      await sleep(5000 * attempt);
    }
  }

  throw new Error(
    'Search API could not be started'
  );
}

module.exports = { wakeSearchApi };