# Contributing to LMP Dashboard

Thanks for helping make wholesale power-market prices easier to understand. This project visualizes real-time and day-ahead locational marginal prices, along with the grid signals that explain them.

## What this repo does

- Shows LMP prices across NYISO, PJM, CAISO, and SPP.
- Breaks prices into energy, congestion, and loss components where available.
- Reads from the Kardashev Data API at `https://data.kardashevlabs.org`.

Stack: Next.js 15, React 19, TypeScript, Tailwind CSS v4, Recharts.

## Local setup

```bash
cd web
npm install
KARDASHEV_API_URL=https://data.kardashevlabs.org npm run dev
```

Open `http://localhost:3000`.

You can also run with Docker Compose:

```bash
docker compose up --build
```

## Before opening a PR

From `web/`:

```bash
npm run build
```

If you change chart behavior, include before/after screenshots.

## Good first contributions

- Improve chart empty/loading/error states.
- Add clearer labels for energy, congestion, and loss components.
- Improve mobile chart spacing.
- Add a saved list of common hubs/nodes.
- Add a short explainer for what LMP means and why congestion matters.

## Product guidelines

- Keep the interface fast and readable under dense data.
- Do not hide timestamps or market names.
- Prefer plain-language labels over market jargon when both are possible.
- Make it easy to compare locations without overwhelming the page.

## PR guidelines

- Keep UI changes focused.
- Include screenshots for visual changes.
- Do not hard-code secrets or private API URLs.
- Mention which market(s) you checked.
