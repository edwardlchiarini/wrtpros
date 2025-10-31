# Contact form SMS notifier

This project exposes a small HTTP server that serves a contact form and sends
an SMS text message whenever someone submits the form. The SMS is delivered via
[Twilio's Messaging API](https://www.twilio.com/docs/messaging).

## Getting started

1. Install Node.js 18 or newer.
2. Clone the repository and install dependencies (none are required beyond the
   standard library, so you can skip `npm install`).
3. Create a `.env` file or export the required environment variables before
   starting the server:

   ```bash
   export TWILIO_ACCOUNT_SID="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
   export TWILIO_AUTH_TOKEN="your_twilio_auth_token"
   export TWILIO_FROM_NUMBER="+15555555555"
   export CONTACT_TO_NUMBER="+15555555555"
   # Optional: bypass Twilio while testing locally
   export SKIP_TWILIO="true"
   ```

4. Start the development server:

   ```bash
   npm start
   ```

5. Visit [http://localhost:3000](http://localhost:3000) and submit the contact
   form. When the Twilio credentials are configured, the submission triggers an
   SMS to `CONTACT_TO_NUMBER`.

## Testing

A light-weight smoke test spins up the HTTP server, checks that the home page is
served, and verifies the validation path of the contact endpoint:

```bash
npm test
```

## Configuration notes

- Set `SKIP_TWILIO=true` when running tests or developing without internet
  access. With the flag enabled, the server behaves as if the SMS send was
  successful without contacting Twilio.
- The server expects properly formatted JSON bodies on `POST /api/contact` and
  limits incoming payloads to 1 MB.
- Static files are served from the `public/` directory.
