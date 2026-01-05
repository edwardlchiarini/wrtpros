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

## Capturing UI screenshots in CI sandboxes

If you need to help the agent grab a screenshot of the refreshed landing page
while working in a locked-down environment, these steps typically solve browser
automation failures:

1. Ensure the dev server is running and reachable at `http://localhost:3000` by
   starting it in a separate shell with `npm start` before the automation step.
2. Confirm port `3000` is exposed to the browser container (or forwarded when
   invoking Playwright) so the page is accessible.
3. Avoid ad-blockers or restrictive network policies in the sandbox; they can
   block asset requests and cause blank screenshots.
4. If screenshots still fail, capture a static render by running `npm test` to
   confirm the app builds, then use Playwright's `page.screenshot()` against the
   running server with adequate wait time for fonts/images to load.

## Deployment

### GitHub Pages (Static Frontend Only)

This repository includes a GitHub Actions workflow that automatically deploys
the static files from the `public/` directory to GitHub Pages when changes are
pushed to the `main` branch.

**Note:** GitHub Pages only hosts static files. The contact form will not
function without a backend server to handle the `/api/contact` endpoint.

To enable GitHub Pages:

1. Go to your repository Settings → Pages
2. Under "Build and deployment", select "GitHub Actions" as the source
3. Push to the `main` branch to trigger the deployment workflow

### Full Application Deployment (with Backend)

To deploy the complete application with working contact form functionality, use
a platform that supports Node.js applications:

#### Option 1: Render

This repository includes a `render.yaml` configuration file for easy deployment.

1. Create a new Blueprint at [render.com](https://render.com)
2. Connect your GitHub repository
3. Render will detect the `render.yaml` file and configure the service automatically
4. Add your Twilio credentials as environment variables
5. Deploy

Alternatively, you can create a Web Service manually:
- **Build Command:** (leave empty)
- **Start Command:** `node server.js`

#### Option 2: Railway

1. Create a new project at [railway.app](https://railway.app)
2. Connect your GitHub repository
3. Railway will auto-detect the Node.js application
4. Add environment variables for Twilio credentials
5. Deploy

#### Option 3: Vercel

1. Install the Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project directory
3. Follow the prompts to deploy
4. Add environment variables via the Vercel dashboard

## Configuration notes

- Set `SKIP_TWILIO=true` when running tests or developing without internet
  access. With the flag enabled, the server behaves as if the SMS send was
  successful without contacting Twilio.
- The server expects properly formatted JSON bodies on `POST /api/contact` and
  limits incoming payloads to 1 MB.
- Static files are served from the `public/` directory.

## FAQ

### Where is wrtpros.com hosted?

The `wrtpros.com` domain currently has no DNS records pointing to a hosting
provider, so it is not serving this site publicly. To run the site, deploy this
Node.js server to your preferred host and configure the domain’s DNS to point
there.
