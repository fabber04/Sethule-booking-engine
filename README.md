# Sethule booking engine (local prototype)

React + Vite frontend with a **local Node API** used for realistic **Paynow “Initiate Transaction”** redirects (secrets stay off the frontend).

## Prereqs

- Node 20+
- Your Paynow **Integration ID** + **Integration Key** from the merchant dashboard

## Configure Paynow secrets (backend)

Copy `server/.env.example` → `server/.env` and fill in:

```bash
PAYNOW_INTEGRATION_ID="123456"
PAYNOW_INTEGRATION_KEY="your-integration-key"
PUBLIC_APP_ORIGIN="http://localhost:5173"
PUBLIC_API_ORIGIN="http://localhost:8787"
```

## Run (recommended)

Terminal 1 (API):

```bash
cd booking-engine/server
npm install
npm run dev
```

Terminal 2 (UI):

```bash
cd booking-engine
npm install
npm run dev
```

The UI proxies `/api/*` → `http://localhost:8787` (see `vite.config.ts`).

## Notes on realism

- The backend calls Paynow’s initiate endpoint with a SHA512 hash and validates hashes on responses.
- `resulturl` callbacks require Paynow to reach your machine; localhost works best with a tunnel tool for real webhook delivery.
