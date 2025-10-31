const http = require('http');
const { createServer } = require('../server');

async function makeRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const responseBody = Buffer.concat(chunks).toString();
        resolve({
          statusCode: res.statusCode,
          body: responseBody,
          headers: res.headers,
        });
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function run() {
  process.env.SKIP_TWILIO = 'true';
  const server = createServer();

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();

  try {
    const homeResponse = await makeRequest({
      hostname: '127.0.0.1',
      port,
      path: '/',
      method: 'GET',
    });

    if (homeResponse.statusCode !== 200) {
      throw new Error(`Expected GET / to return 200, got ${homeResponse.statusCode}`);
    }

    const invalidContact = await makeRequest(
      {
        hostname: '127.0.0.1',
        port,
        path: '/api/contact',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      JSON.stringify({})
    );

    if (invalidContact.statusCode !== 400) {
      throw new Error(
        `Expected POST /api/contact with empty payload to return 400, got ${invalidContact.statusCode}`
      );
    }

    console.log('Smoke test passed.');
  } finally {
    server.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
