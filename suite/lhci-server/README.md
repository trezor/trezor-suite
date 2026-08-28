# Suite perf LHCI server

The [Lighthouse CI server](https://github.com/GoogleChrome/lighthouse-ci) instance that stores the
performance history of the Suite e2e `@perf` scenarios: nightly `develop` baselines and per-PR
samples, uploaded by the `perf-report`/`perf-baseline` CI jobs (see
`.github/workflows/test-suite-web-desktop-e2e-{pr,nightly}.yml`). The PR delta report is computed
by our own script against this server's REST API; the server itself is a dumb LHR store with a
dashboard — all data stays exportable from Postgres.

This directory is the **`@suite/lhci-server` workspace**. Nothing in the monorepo imports it — the
workspace exists so the pinned server is resolved by the root `yarn.lock` like every other
dependency, and the Docker image installs it with `yarn workspaces focus @suite/lhci-server
--production`. That is why the image is built with the **repo root as its build context** (see
`docker-compose.yml`); a checkout of the repo is therefore part of the host requirements.

## Layout

| File                      | Purpose                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------- |
| `docker-compose.yml`      | caddy (TLS edge) + lhci (server 0.15.1) + postgres 16, plus a local-only `dev` db forwarder |
| `Dockerfile`              | node:22-alpine, focused yarn install of `@lhci/*` + `pg`, non-root, `/healthz` healthcheck  |
| `Dockerfile.dockerignore` | trims the monorepo build context; the root `.dockerignore` would drop needed workspaces     |
| `lighthouserc.json`       | server config: postgres storage, retention (PR builds 30 d, `develop` 180 d)                |
| `tsconfig.json`           | empty project — no TS lives here, it only keeps `yarn refs` from generating one             |
| `Caddyfile`               | auto-TLS; 403s the admin surface at the edge; 12 MB body cap                                |
| `env.example`             | template for `.env` (gitignored)                                                            |

## Security model

- **Writes** (POST builds/runs, PUT seal) need the project **build token** (`x-lhci-build-token`),
  stored as the `LHCI_BUILD_TOKEN` repo secret. **GETs are open** — CI needs them, and the
  dashboard shows perf metrics of a public app measured on test wallets. That is the stated
  trade-off; if lock-down is ever required, use `BASIC_AUTH_*` (then CI needs the credentials too).
- **Admin surface is edge-blocked**: `POST /v1/projects` (unauthenticated in LHCI by design!),
  `DELETE /v1/*` and `PUT` on the project resource all get a Caddy 403. Admin work happens through
  an SSH tunnel to the loopback-published port 9001.
- **Postgres is never published**: `db` has no host port at all, so it is reachable only from
  inside the compose network. Local GUI access goes through the `dev` profile's `db-forward`
  (loopback only, see below) — production runs `docker compose up -d` with no profile, so that
  forwarder never exists there. On the box itself, `docker compose exec db psql -U lhci`.
- **Known accepted risk**: the build token is readable by same-repo PR CI code, so a malicious
  same-repo PR could seal fabricated `develop` builds and poison baselines. Watch the dashboard's
  develop build list for builds that do not match nightly runs, and rotate the token on suspicion
  (see below).

## Bootstrap (one-time)

1. VPS with Docker + compose v2 and 2 GB RAM (Hostinger KVM2-class or any box). Create the DNS
   A record for the chosen `LHCI_HOST` **first** — Caddy needs it resolvable for ACME issuance.
2. Clone the repo on the box — the image is built from the monorepo root, but only the tracked
   tree is needed (no submodules, no LFS blobs, no `yarn install` on the host):

    ```sh
    GIT_LFS_SKIP_SMUDGE=1 git clone --depth 1 --branch develop \
      https://github.com/trezor/trezor-suite.git /opt/trezor-suite
    cd /opt/trezor-suite/suite/lhci-server
    ```

3. ```sh
   cp env.example .env   # fill in LHCI_HOST + POSTGRES_PASSWORD
   docker compose up -d --build
   curl -fsS https://<LHCI_HOST>/healthz   # → healthy
   ```
4. **Create the project from inside the lhci container** — the edge 403s project creation on
   purpose, and the image already carries the pinned CLI, so this needs no tunnel and no download:
    ```sh
    docker compose exec lhci ./node_modules/.bin/lhci wizard
    # → new-project, http://localhost:9001, name "trezor-suite", set baseBranch to develop
    ```
    The wizard prints the **build token** and **admin token** exactly once.
5. Tokens → 1Password. Build token → repo secret `LHCI_BUILD_TOKEN`. The admin token never goes
   near CI — it is only for project admin. To reach the dashboard's admin surface from a browser,
   tunnel to the loopback-published port instead:
    ```sh
    ssh -L 9001:127.0.0.1:9001 <vps>   # remote port = LHCI_ADMIN_PORT if you overrode it
    ```
6. Smoke-test the edge:
    ```sh
    curl -s -o /dev/null -w '%{http_code}' -X POST https://<LHCI_HOST>/v1/projects   # → 403
    curl -s https://<LHCI_HOST>/v1/projects                                          # → [] project list (GETs open)
    ```
7. Backups + monitoring. Install `/usr/local/bin/lhci-backup.sh` (adjust the compose path):

    ```sh
    #!/bin/sh
    # Daily Postgres dump; Sunday dumps are kept 4× longer. Dump and compress WITHOUT a pipe so a
    # failed pg_dump aborts (sh -e cannot see a pipe's left side fail) and never triggers the prune.
    set -eu
    dir=/var/backups/lhci
    compose="docker compose -f /opt/trezor-suite/suite/lhci-server/docker-compose.yml"
    mkdir -p "$dir"
    kind=daily; [ "$(date +%u)" = 7 ] && kind=weekly
    tmp="$dir/.lhci-$kind-$(date +%F).sql"
    $compose exec -T db pg_dump -U lhci lhci > "$tmp"
    gzip -f "$tmp"
    mv "$tmp.gz" "$dir/lhci-$kind-$(date +%F).sql.gz"
    find "$dir" -name 'lhci-daily-*.sql.gz' -mtime +7 -delete
    find "$dir" -name 'lhci-weekly-*.sql.gz' -mtime +28 -delete
    ```

    ```sh
    # /etc/cron.d/lhci-backup
    0 3 * * * root /usr/local/bin/lhci-backup.sh
    ```

    Point an uptime check (e.g. the existing sldev monitoring) at `https://<LHCI_HOST>/healthz`.

## Token rotation

There is no HTTP endpoint for this (0.15.1's `PUT /v1/projects/<id>` silently ignores `token`) —
the reset wizard talks straight to the database, so run it inside the lhci container on the VPS:

```sh
docker compose exec lhci ./node_modules/.bin/lhci wizard --storage.storageMethod=sql --storage.sqlDialect=postgres
# → reset-build-token (or reset-admin-token), pick the project, confirm — the new token prints once
```

The connection url is missing from that command on purpose: the wizard picks it up from the
container's `LHCI_STORAGE__SQL_CONNECTION_URL`, so the password never lands in a command line.

Quick non-interactive alternative for the build token only (it is a plain UUID column):

```sh
docker compose exec db psql -U lhci -d lhci \
  -c "UPDATE projects SET token = gen_random_uuid() WHERE name = 'trezor-suite' RETURNING token;"
```

Then update the `LHCI_BUILD_TOKEN` repo secret.

## Local smoke test

```sh
cp env.example .env
# set: LHCI_HOST=localhost  CADDY_HTTP_PORT=8080  CADDY_HTTPS_PORT=8443  LHCI_ADMIN_PORT=9011
# and a POSTGRES_PASSWORD
docker compose up -d --build
curl -sk https://localhost:8443/healthz   # Caddy serves a self-signed cert for localhost
```

To point a GUI client (DBeaver…) at the database, start the `dev` profile's forwarder — it
publishes Postgres on `127.0.0.1:${DB_LOCAL_PORT:-5434}` for as long as you leave it up:

```sh
docker compose --profile dev up -d db-forward   # host localhost:5434, db/user lhci, password from .env
docker compose stop db-forward                  # done poking around
```

## Operations quick reference

```sh
docker compose logs -f lhci          # server logs (retention cron logs here at 04:00/04:30)
docker compose exec db psql -U lhci  # the data is yours — plain Postgres
git pull && docker compose pull && docker compose up -d --build   # update caddy/postgres/rebuild lhci
```

Bumping the server itself is a normal dependency change: edit `package.json` here, run
`yarn install` in the repo so the root lockfile follows, and the `git pull` above brings both to the
box.
