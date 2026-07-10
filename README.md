# LMP Dashboard

Live at **[lmp.kardashevlabs.org](https://lmp.kardashevlabs.org)** · Part of [Kardashev Labs](https://kardashevlabs.org)

Real-time wholesale electricity prices: locational marginal prices (LMP) across
**NYISO, PJM, CAISO, and SPP**, broken into energy, congestion, and loss components,
alongside the grid signals that explain them: fuel mix, system load, natural gas
prices and storage, weather, curtailment, reserve margins, and battery storage
(CAISO).

## What is LMP?

The locational marginal price is what wholesale electricity costs at a specific
point on the grid at a specific moment. It has three parts:

- **Energy**: the system-wide marginal cost of generation
- **Congestion**: the premium (or discount) from transmission constraints
- **Loss**: the cost of electrical losses delivering power to that location

Price spikes at a node usually mean transmission congestion, a signal of where the
grid needs reinforcement or storage.

## Architecture

This repo is a frontend only. All data comes from
[kardashev-data](https://github.com/kardashev-lab/kardashev-data), which ingests
ISO/RTO feeds and serves them at `data.kardashevlabs.org`.

```
ISO/RTO feeds → kardashev-data (ingest + Postgres + API)
                       ↓
          data.kardashevlabs.org
                       ↓
          Next.js SSR dashboard (this repo)
```

## Stack

- Next.js 15, React 19, TypeScript, Tailwind CSS v4
- Recharts
- Deployed on Railway as a standalone Next.js container

## Local development

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000.

| Variable | Default | Purpose |
|----------|---------|---------|
| `KARDASHEV_API_URL` | `https://data.kardashevlabs.org` | Base URL of the kardashev-data API |
| `NEXT_PUBLIC_SITE_URL` | (optional) | Canonical site URL for metadata |

Or with Docker:

```bash
docker compose up --build
```

## Deployment

Deploys to Railway via [railway.toml](railway.toml). Builds `web/Dockerfile` with the
repo root as context. Any platform that can run a Dockerfile works.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT · [github.com/kardashev-lab](https://github.com/kardashev-lab)
