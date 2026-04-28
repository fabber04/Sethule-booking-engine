# Sethule Booking Engine (Prototype)

Mobile-first booking engine prototype designed for deployment to **GitHub Pages** and integration by redirecting the existing **“Book Now”** button on `sethulelodge.com`.

## Run locally

```bash
cd booking-engine
npm install
npm run dev
```

## Stripe test-mode checkout (no backend)

This prototype uses a **Stripe Payment Link** (opens in a new tab) for a realistic payment handoff.

1. Create a Payment Link in Stripe (test mode).
2. Copy the Payment Link URL.
3. Create `.env.local` in `booking-engine/`:

```bash
VITE_STRIPE_PAYMENT_LINK="https://buy.stripe.com/..."
```

Restart the dev server.

## Deploy to GitHub Pages

This repo includes a workflow at `.github/workflows/deploy.yml` that deploys automatically on pushes to `main`.

Steps:
- Create a GitHub repo and push this folder.
- In GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
- Push to `main` and wait for the workflow to finish.

Your Pages URL will look like:
- `https://<github-user>.github.io/<repo-name>/`

## Integration (agency copy/paste)

Ask your agency to update the existing **Book Now** button link to:
- `https://<github-user>.github.io/<repo-name>/`

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
