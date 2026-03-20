# @trezor/analytics-docs (Analytics Events Docs)

UI for browsing generated documentation (`analytics.json`) and displaying analytics events from `@trezor/analytics-log-server` (Live log).

The documentation is deployed as **static assets** via the `[Build] analytics-docs` workflow. For Live log, you need to run the log server separately (see `@trezor/analytics-log-server`).

## What the UI does

- Displays the list of events from `analytics.json` (changelog/sections by platform).
- Live log connects to the log server

## Live log configuration

In `Live log` inside `analytics-docs`, open **Settings** and set:

- **Log server base URL** (e.g. `http://localhost:5181`)

The UI will then:

- read the SSE stream: `BASE_URL/api/analytics-events/stream`
- send the “custom analytics URL” to Suite: `BASE_URL/log`

> Suite (web/desktop) sends events to the `/log` endpoint as a GET request with query parameters.

## Run Analytics Docs

```bash
yarn workspace @trezor/analytics-docs dev
```

In your browser, open Live log Settings and set the base URL to `http://localhost:5180`.

## Production deployment

1. **Analytics Docs (static assets)**: deployed by `.github/workflows/build-analytics-docs.yml`.
2. **Log server**: deployed separately (Docker image from `packages/analytics-log-server/Dockerfile`) and must be reachable from the Suite/analytics-docs domain(s) according to your infrastructure.
