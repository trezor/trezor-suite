# Trezor Hive Memory — TODO & Roadmap

## Current state

Fully operational with 6 MCP tools, 8 REST endpoints, Admin UI, and monorepo graph ingested.

**MCP tools:** `store_session_learning`, `recall_learnings`, `get_learning`, `session_save`, `recall_related`, `get_dependency_impact`

**Unique strength:** monorepo-aware graph traversal via Neo4j — no competitor does this.

---

## Ecosystem comparison

Projects surveyed: [hive-memory](https://github.com/moonx010/hive-memory),
[MCP official memory](https://github.com/modelcontextprotocol/servers/blob/main/src/memory),
[memlord](https://github.com/MyrikLD/memlord),
[tensory](https://github.com/kryptogrib/tensory),
[Muninn](https://github.com/wjohns989/Muninn),
[mem0](https://github.com/mem0ai/mem0)

|                          | **ours**                   | **hive-memory**           | **MCP official**      | **memlord**         | **tensory**                 | **Muninn**               |
| ------------------------ | -------------------------- | ------------------------- | --------------------- | ------------------- | --------------------------- | ------------------------ |
| **Lang**                 | TypeScript                 | TypeScript                | TypeScript            | Python              | Python                      | Python                   |
| **Storage**              | Neo4j + Postgres           | SQLite                    | JSONL file            | Postgres + pgvector | SQLite                      | SQLite + Qdrant          |
| **Transport**            | HTTP only                  | stdio + HTTP              | stdio                 | HTTP                | stdio + HTTP                | stdio + HTTP             |
| **MCP tools**            | 6                          | 33                        | 9                     | 10                  | 7                           | 50+                      |
| **Search / recall**      | ✅ FTS + tags + graph      | keyword + graph traversal | keyword               | BM25 + vector + RRF | FTS5 + vector + graph + RRF | 5-signal hybrid          |
| **Graph memory**         | ✅ Neo4j (ingested)        | synapses (SQLite)         | entity/relation nodes | ❌                  | entities + relations        | temporal knowledge graph |
| **Recall tool**          | ✅ FTS + graph traversal   | ✅ spreading activation   | ✅                    | ✅                  | ✅ claim-native             | ✅ explainable traces    |
| **Auto session capture** | ✅ SessionEnd hook         | ✅ SessionEnd hook        | ❌                    | ❌                  | ✅ Claude Code plugin       | ❌                       |
| **Admin UI**             | ✅ /ui                     | ❌                        | ❌                    | ❌                  | ❌                          | ❌                       |
| **Multi-user / teams**   | ❌                         | ✅ git-based sync         | ❌                    | ✅ OAuth 2.1        | ❌                          | ✅ hive-mind federation  |
| **Infra complexity**     | 🔴 Neo4j + Postgres        | 🟢 zero                   | 🟢 zero               | 🟡 Postgres         | 🟢 zero                     | 🟡 optional Qdrant       |
| **Conflict detection**   | ❌                         | ❌                        | ❌                    | dedup only          | ✅ built-in                 | ✅ NLI transformer       |
| **Monorepo-specific**    | ✅ `get_dependency_impact` | ❌                        | ❌                    | ❌                  | ❌                          | ❌                       |

---

## Remaining roadmap

### P1 — stdio transport mode

**Why:** HTTP-only + Docker requirement creates friction for local dev. stdio enables `npx`/`node` invocation with zero infrastructure — same pattern as hive-memory, tensory, Muninn.

**What to build:**

- Detect `STDIO_MODE=true` env var in `server.ts`
- When set: skip Fastify, use `StdioServerTransport` from `@modelcontextprotocol/sdk`
- Document in INSTALL.md with an example `.mcp.json` using `"command": "node"` transport

**Files:** `apps/trezor-hive-memory/src/server.ts`, `INSTALL.md`, `skills/trezor-hive-memory/SKILL.md`

---

### P2 — Near-duplicate detection before storing learnings

**Why:** Over many sessions, similar insights accumulate as noise. memlord detects near-duplicates before insert.

**What to build:**

- Add `pg_trgm` extension in migration
- Before `INSERT` in `storeLearning()`, check similarity > 0.75 threshold
- Return `{ duplicate: true, existing: LearningResult }` from MCP tool if match found
- Agent decides whether to supersede or force-insert via `{ force: true }`

**Files:** `packages/session-store/src/index.ts`, `packages/shared-types/src/index.ts`, `apps/trezor-hive-memory/src/mcp/tools.ts`

---

### P2.5 — Client-side retry queue for failed MCP requests

**Why:** If the gateway is down (Docker not running) when a learning or session is saved, the data is silently lost.

**What to build:**

- On `store_session_learning` / `session_save` failure, append payload to `~/.claude/projects/<project>/mcp-queue.jsonl`
- On next session start (or periodic drain), replay queued requests against the gateway
- Also applies to the SessionEnd hook (currently best-effort, drop on failure)

---

### P4 — Future

- **`memory_timeline`** — chronological view of learnings + sessions; useful for agent orientation at session start (`{ since?, until?, limit? }`)
- **Export/import CLI** — `hive-memory export --output backup.jsonl` / `hive-memory import`; essential for team handoffs and disaster recovery
- **Hebbian co-activation** — increment `CO_ACTIVATED` edge weights in Neo4j when two learnings are co-recalled; `recall_related` boosts link strength over time

---

## Architecture decisions

| Decision                 | Rationale                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Keep Neo4j               | `get_dependency_impact` + `recall_related` genuinely benefit from a graph DB; no competitor does monorepo-aware traversal |
| Keep Postgres            | Relational queries, FTS (tsvector), array ops (GIN on tags), ACID — right tool for learnings + sessions                   |
| Add stdio alongside HTTP | Removes zero-infra barrier; same tools, different transport; env-switched                                                 |
| Progressive disclosure   | `recall_learnings` returns compact list; `get_learning(id)` fetches full detail; reduces per-call token cost              |
| No embeddings (yet)      | FTS + tag + graph traversal covers the core use case without an embedding model dependency                                |
