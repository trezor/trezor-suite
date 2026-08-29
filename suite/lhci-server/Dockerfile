# Lighthouse CI server for Suite perf history — see README.md for the runbook.
#
# Built from the monorepo root (docker-compose.yml points the context there): this directory is the
# @suite/lhci-server workspace, so the pinned server is installed by yarn from the root yarn.lock —
# pg + pg-hstore because @lhci/server bundles no DB driver. Only node_modules crosses into the
# runtime stage; the sources the install needed stay behind in the builder.
FROM node:22-alpine AS deps

WORKDIR /repo

# The whole monorepo: yarn resolves the lockfile against every workspace manifest, so a partial
# copy fails outright. Dockerfile.dockerignore keeps build artifacts out of the context.
COPY . .

# Yarn runs straight from its committed release (glob so a yarn upgrade needs no edit here), so the
# image downloads no package manager of its own. --production omits devDependencies; the focused
# install touches only this workspace. Focus resolves as if this were the project's only workspace,
# which an immutable install (yarn's default whenever CI is set) reports as a lockfile change — the
# lockfile is never written here, so opt out and let the build work the same in CI.
RUN YARN_ENABLE_IMMUTABLE_INSTALLS=false \
    node .yarn/releases/yarn-*.cjs workspaces focus @suite/lhci-server --production

# A single-workspace focus hoists everything into the root node_modules. A nested one would mean
# the runtime stage silently misses packages, so fail the build here instead.
RUN [ ! -d suite/lhci-server/node_modules ]

FROM node:22-alpine

WORKDIR /srv/lhci

COPY --from=deps /repo/node_modules ./node_modules
COPY suite/lhci-server/lighthouserc.json ./

# The server only listens on 9001 and talks to postgres — no reason to keep root.
USER node

EXPOSE 9001
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:9001/healthz || exit 1

# Exec form, so the server is PID 1 with no shell in between — and, the actual point, no secret on
# the command line: /proc/1/cmdline is world-readable inside the container, and lhci echoes argv on
# a startup error. Everything but this config file arrives through LHCI_* env vars, which the CLI
# maps onto its own options (see docker-compose.yml).
CMD ["./node_modules/.bin/lhci", "server", "--config=lighthouserc.json"]
