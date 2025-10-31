const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const querystring = require('querystring');

const PUBLIC_DIR = path.join(__dirname, 'public');

const REQUIRED_ENV_VARS = [
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_FROM_NUMBER',
  'CONTACT_TO_NUMBER',
];

function validatePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return 'Invalid request body.';
  }

  const name = (payload.name || '').trim();
  const email = (payload.email || '').trim();
  const phone = (payload.phone || '').trim();
  const message = (payload.message || '').trim();

  if (!name) {
    return 'Please provide your name.';
  }

  if (!message) {
    return 'Please include a message.';
  }

  if (message.length > 1000) {
    return 'Message is too long. Please keep it under 1000 characters.';
  }

  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    return 'Email address looks invalid.';
  }

  return null;
}

function buildSmsBody(payload) {
  const lines = [
    `New website contact from ${payload.name || 'Unknown name'}.`,
  ];

  if (payload.email) {
    lines.push(`Email: ${payload.email}`);
  }

  if (payload.phone) {
    lines.push(`Phone: ${payload.phone}`);
  }

  lines.push('Message:');
  lines.push(payload.message || '(No message provided)');

  return lines.join('\n');
}

function sendSms(payload) {
  return new Promise((resolve, reject) => {
    if (process.env.SKIP_TWILIO === 'true') {
      console.warn('SKIP_TWILIO flag enabled. SMS messages will not be sent.');
      resolve();
      return;
    }

    for (const key of REQUIRED_ENV_VARS) {
      if (!process.env[key]) {
        return reject(
          new Error(
            `Missing environment variable ${key}. Please configure Twilio credentials.`
          )
        );
      }
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_FROM_NUMBER;
    const toNumber = process.env.CONTACT_TO_NUMBER;

    const body = buildSmsBody(payload);

    const postData = querystring.stringify({
      From: fromNumber,
      To: toNumber,
      Body: body,
    });

    const options = {
      hostname: 'api.twilio.com',
      path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
      method: 'POST',
      auth: `${accountSid}:${authToken}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const request = https.request(options, (response) => {
      let responseBody = '';
      response.setEncoding('utf8');

      response.on('data', (chunk) => {
        responseBody += chunk;
      });

      response.on('end', () => {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve();
        } else {
          const err = new Error(
            `Twilio API responded with status ${response.statusCode}: ${responseBody}`
          );
          reject(err);
        }
      });
    });

    request.on('error', (error) => {
      reject(error);
    });

    request.write(postData);
    request.end();
  });
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.js':
      return 'application/javascript; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}

function serveStaticFile(filePath, res) {
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const stream = fs.createReadStream(filePath);
    stream.on('open', () => {
      res.writeHead(200, { 'Content-Type': getContentType(filePath) });
    });
    stream.on('error', (streamErr) => {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Error reading file.');
      console.error('Failed to read file', streamErr);
    });
    stream.pipe(res);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(payload));
}

function handleContactRequest(req, res) {
  let rawBody = '';
  let requestTooLarge = false;

  req.on('data', (chunk) => {
    rawBody += chunk;
    if (!requestTooLarge && rawBody.length > 1e6) {
      requestTooLarge = true;
      sendJson(res, 413, {
        message: 'Payload too large. Please send a smaller message.',
      });
      req.destroy();
    }
  });

  req.on('end', async () => {
    if (requestTooLarge) {
      return;
    }

    let payload;
    try {
      payload = JSON.parse(rawBody || '{}');
    } catch (error) {
      sendJson(res, 400, { message: 'Invalid JSON body.' });
      return;
    }

    const validationError = validatePayload(payload);
    if (validationError) {
      sendJson(res, 400, { message: validationError });
      return;
    }

    try {
      await sendSms(payload);
      sendJson(res, 200, {
        message: 'Thanks! We just received your message via text.',
      });
    } catch (error) {
      console.error('Failed to send SMS', error);
      const statusCode =
        error && /Missing environment variable/.test(error.message) ? 500 : 502;
      sendJson(res, statusCode, {
        message:
          statusCode === 500
            ? 'Configuration error: please contact the site administrator.'
            : 'We could not send your message right now. Please try again later.',
      });
    }
  });
}

function createRequestListener() {
  return (req, res) => {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'POST' && parsedUrl.pathname === '/api/contact') {
      handleContactRequest(req, res);
      return;
    }

    if (req.method === 'OPTIONS' && parsedUrl.pathname === '/api/contact') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end();
      return;
    }

    let filePath = path.join(
      PUBLIC_DIR,
      parsedUrl.pathname === '/' ? 'index.html' : parsedUrl.pathname
    );

    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    serveStaticFile(filePath, res);
  };
}

function createServer() {
  return http.createServer(createRequestListener());
}

if (require.main === module) {
  const port = process.env.PORT || 3000;
  const server = createServer();
  server.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

module.exports = {
  createServer,
  validatePayload,
  buildSmsBody,
};
