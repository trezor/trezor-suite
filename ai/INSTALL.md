# Trezor Hive Memory

Shared knowledge graph for AI coding agents. Stores learnings, session summaries, and monorepo dependency data in Neo4j + Postgres, exposed via MCP (Model Context Protocol) and REST API.

Agents use MCP tools to store insights during sessions and recall them in future sessions, building a persistent memory layer across Claude Code, GitHub Copilot, Cursor, and Windsurf.

## Architecture

```
  AI Agent (Claude Code / Copilot / Cursor)
       |
       | MCP (Streamable HTTP) or REST
       v
  ┌─────────────────────────────┐
  │  trezor-hive-memory         │
  │  (Fastify, port 8080)       │
  │                             │
  │  /mcp    — MCP tools        │
  │  /api/*  — REST endpoints   │
  │  /ui     — Admin dashboard  │
  └──────┬──────────┬───────────┘
         │          │
    Neo4j (7687)  Postgres (5432)
```

## Prerequisites

- Node.js >= 20
- Docker & Docker Compose
- Yarn 4 (enabled via corepack)

## Quick Start

```bash
cd ai

# 1. Copy environment and install dependencies
cp .env.example .env
yarn install

# 2. Start databases
docker compose up -d neo4j postgres

# 3. Wait for healthy status
docker compose ps  # both should show "healthy"

# 4. Build all packages
yarn build

# 5. Start the gateway (with databases running in Docker)
docker compose up --build gateway
## or in the background
docker compose up -d --build gateway

# 6. Verify
curl http://localhost:8080/api/health
# → {"status":"ok","neo4j":true,"postgres":true,"uptime":...}
```

## Ingest Monorepo Graph

Populates Neo4j with Package nodes and DEPENDS_ON edges from the monorepo workspace:

```bash
cd ai
NEO4J_PASSWORD=changeme-neo4j-secret yarn ingest-graph

# Dry run (prints package tree without writing to Neo4j):
yarn ingest-graph:dry
```

## REST API

All endpoints except `/api/health` and `/ui` require `Authorization: Bearer <token>`.
In dev mode (`JWT_SECRET=changeme-jwt-secret`), any token value is accepted.

```bash
TOKEN="Authorization: Bearer test"

# Health check (no auth required)
curl http://localhost:8080/api/health

# Store a learning
curl -X POST http://localhost:8080/api/learn \
  -H "$TOKEN" -H 'Content-Type: application/json' \
  -d '{"summary":"Example insight","tags":["test"]}'

# Search learnings (full-text search)
curl -H "$TOKEN" 'http://localhost:8080/api/learnings?q=example'

# Get learning by ID
curl -H "$TOKEN" 'http://localhost:8080/api/learnings/<uuid>'

# Update a learning
curl -X PUT http://localhost:8080/api/learnings/<uuid> \
  -H "$TOKEN" -H 'Content-Type: application/json' \
  -d '{"summary":"Updated insight","tags":["test","updated"]}'

# Delete a learning
curl -X DELETE -H "$TOKEN" 'http://localhost:8080/api/learnings/<uuid>'

# Save a session summary
curl -X POST http://localhost:8080/api/sessions \
  -H "$TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"Session title","summary":"What was done","nextSteps":["next"],"tags":["dev"],"learningIds":[]}'

# List recent sessions
curl -H "$TOKEN" 'http://localhost:8080/api/sessions?limit=10'

# Dependency impact analysis
curl -H "$TOKEN" 'http://localhost:8080/api/impact?symbol=@trezor/connect&depth=2'

# Graph traversal (related nodes)
curl -H "$TOKEN" 'http://localhost:8080/api/related?symbol=@trezor/connect&depth=2'

# Full graph export (for visualization)
curl -H "$TOKEN" 'http://localhost:8080/api/graph?limit=500'
```

## Admin UI

Open http://localhost:8080/ui in your browser. No authentication required for the UI itself; it injects the Bearer token (configurable in the header input) into API calls.

Features:

- **Learnings tab** — search, filter by tags/engineer/date, inline edit, delete
- **Sessions tab** — expandable cards with summaries and next steps
- **Graph tab** — interactive vis-network visualization of the knowledge graph

## Client Integration

### Claude Code

Already configured in `.mcp.json` at the repo root:

```json
{
    "mcpServers": {
        "trezor-hive-memory": {
            "type": "url",
            "url": "http://127.0.0.1:8080/mcp",
            "headers": {
                "Authorization": "Bearer test"
            }
        }
    }
}
```

Available MCP tools: `store_session_learning`, `recall_learnings`, `get_learning`, `session_save`, `recall_related`, `get_dependency_impact`.

To enable automatic session capture, add to `.claude/settings.json`:

```json
{
    "hooks": {
        "SessionEnd": [
            {
                "command": "node ai/scripts/session-end-hook.mjs"
            }
        ]
    }
}
```

### VS Code (GitHub Copilot)

Already configured in `.vscode/mcp.json`:

```json
{
    "servers": {
        "memory-gateway": {
            "type": "http",
            "url": "http://127.0.0.1:8080/mcp"
        }
    }
}
```

The `/mcp` endpoint does not require authentication headers.

### Cursor

Add to Cursor MCP settings (Settings > MCP Servers):

```json
{
    "memory-gateway": {
        "url": "http://127.0.0.1:8080/mcp"
    }
}
```

### Windsurf

Add to Windsurf MCP configuration:

```json
{
    "mcpServers": {
        "memory-gateway": {
            "serverUrl": "http://127.0.0.1:8080/mcp"
        }
    }
}
```

### REST SDK (scripts, CI, dashboards)

Use the `@ai/hive-memory-client` package:

```ts
import { MemoryClient } from '@ai/hive-memory-client';

const client = new MemoryClient({
    baseUrl: 'http://127.0.0.1:8080',
    token: 'test',
});

const health = await client.health();
const results = await client.searchLearnings({ q: 'docker' });
```

## Backup

```bash
# Postgres
docker exec ai-postgres-1 pg_dump -U memory memory_gateway > backup-pg-$(date +%F).sql

# Neo4j
docker exec ai-neo4j-1 neo4j-admin database dump neo4j --to-path=/tmp
docker cp ai-neo4j-1:/tmp/neo4j.dump backup-neo4j-$(date +%F).dump
```

## Project Structure

```
ai/
  apps/
    trezor-hive-memory/     # Fastify MCP + REST gateway
      public/                # Admin UI (static HTML/JS/CSS)
      src/
        server.ts            # Entry point
        mcp/tools.ts         # MCP tool definitions
        routes/rest.ts       # REST API routes
        middleware/           # JWT auth, audit logging
  packages/
    graph-service/           # Neo4j wrapper
    session-store/           # Postgres wrapper
    shared-types/            # Zod schemas + TS interfaces
    hive-memory-client/      # Typed REST SDK
  scripts/
    ingest-graph.ts          # Monorepo package graph ingestion
    session-end-hook.mjs     # Claude Code SessionEnd hook
  docker-compose.yml
  PLAN.md
```
