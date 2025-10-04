# Bedolaga Web Admin UI

Web interface for Bedolaga Web API and RemnaWave monitoring. The UI mirrors the provided design and maps to the endpoints listed in `docs/web-admin-integration.md`.

## Requirements

- Node.js 18+
- npm (or pnpm/yarn)

## Local Development

```bash
npm install
npm run dev
```

By default the frontend targets `http://127.0.0.1:8080`. You can change the API URL and Bearer token in the initial connection dialog or later via the key icon in the top bar.

### Environment Variables

- `VITE_API_BASE_URL` — Web API URL (defaults to `http://127.0.0.1:8080`).
- `VITE_API_TIMEOUT` — request timeout in ms (defaults to `15000`).

## Highlights

- Dashboard with KPI tiles, sales chart, and quick actions.
- RemnaWave data integration: nodes list and telemetry.
- Bearer token auth with settings persisted to localStorage.
- Fallback data and alerts when the API is unavailable.

## Reference Files

- `docs/web-admin-integration.md` — API documentation.
- `web-admin/src/features/dashboard/api.ts` — API response adapters.

## Docker Compose Launch

```bash
docker compose -f ../docker-compose.local.yml up -d web-admin
```

After dependencies install the Vite dev server is available at `http://localhost:${WEB_ADMIN_PORT:-5173}`. The UI talks to the `bot` container via `http://bot:8080` by default. To connect to an external API set `VITE_API_BASE_URL` in `docker-compose.local.yml` or through the in-app token dialog.

To stop the container:

```bash
docker compose -f ../docker-compose.local.yml stop web-admin
```
