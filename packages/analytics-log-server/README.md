# @trezor/analytics-log-server

Minimalist HTTP server for receiving analytics events from Suite and for realtime viewing in `@trezor/analytics-docs`.

The server stores events in an **in-memory** store (it resets after restart). Live log is provided via SSE.

## Endpoints

### Receive events from Suite

- `GET /log`
    - Suite sends the event as query parameters
    - event type key: `c_type`
    - “meta” fields are mapped from these parameters:
        - `c_v` -> `meta.version`
        - `c_commit` -> `meta.commit`
        - `c_instance_id` -> `meta.instanceId`
        - `c_session_id` -> `meta.sessionId`
        - `c_message_id` -> `meta.messageId`
    - payload is all query parameters that **do not** start with `c_`

### Read events (UI / reload)

- `GET /api/analytics-events`
    - returns a JSON array of events

### SSE stream for Live log

- `GET /api/analytics-events/stream`
    - returns `text/event-stream`
    - data is sent as a JSON array of current events

### Clear events

- `GET /api/analytics-events/clear?clear=1`
    - clears the in-memory store

## CORS

- `Access-Control-Allow-Origin: *`
- methods: `GET, OPTIONS`

This is important mainly for Suite web/desktop, so it can send events to a different domain.

## Local run

### Docker

```bash
cd /Users/janvaclavik/dev/trezor-suite

docker build -f packages/analytics-log-server/Dockerfile -t analytics-log-server .

docker run -d --name analytics-log-server \
  -p 5181:5181 \
  -e PORT=5181 \
  analytics-log-server
```

The default port in Docker is `5181` (override with `PORT`).

## Production deployment

Production deployment typically runs as a standalone Docker container (because the UI is static).

In production, the log server must be reachable from:

- the Suite domain(s) (web/desktop),
- the `analytics-docs` domain(s) (for the SSE stream).

If you use a reverse proxy, map requests to:

- `BASE_URL/log`
- `BASE_URL/api/analytics-events/stream`

## Development in the repo

```bash
yarn workspace @trezor/analytics-log-server dev
```
