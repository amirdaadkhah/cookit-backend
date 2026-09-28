const sleep = (ms) =>
  new Promise(resolve => setTimeout(resolve, ms));

async function wakeSearchApi(searchUrl) {
  const maxAttempts = 3;

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



const body = await response.text();

    console.log('-------------------------');
    console.log('Health URL:', `${searchUrl}/health`);
    console.log('Status:', response.status);
    console.log('Body:', body);

    console.log(
      'server:',
      response.headers.get('server')
    );

    console.log(
      'retry-after:',
      response.headers.get('retry-after')
    );

    console.log(
      'ratelimit-limit:',
      response.headers.get('ratelimit-limit')
    );

    console.log(
      'ratelimit-remaining:',
      response.headers.get('ratelimit-remaining')
    );

    console.log(
      'ratelimit-reset:',
      response.headers.get('ratelimit-reset')
    );

    console.log(
      'cf-ray:',
      response.headers.get('cf-ray')
    );

    console.log('-------------------------');


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
      await sleep(10000 * attempt);
    }
  }

  throw new Error(
    'Search API could not be started'
  );
}

module.exports = { wakeSearchApi };