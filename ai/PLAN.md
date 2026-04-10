Prioritized plan for trezor-hive-memory. Implemented items removed.

## P1 — High value, relatively easy

### 1. stdio transport mode

`STDIO_MODE=true` → use `StdioServerTransport` instead of Fastify. Zero-infra local usage, no Docker needed. Works alongside HTTP. Add example `.mcp.json` using `"command": "node"` transport and document in SKILL.md + INSTALL.md.

**Files:** `apps/trezor-hive-memory/src/server.ts`, `INSTALL.md`, `skills/trezor-hive-memory/SKILL.md`

## P2 — Quality

### 2. Near-duplicate detection

`pg_trgm` similarity check before storing. Before `INSERT` in `storeLearning()`, query:

```sql
SELECT id, summary, similarity(summary, $new) AS sim
FROM learnings WHERE similarity(summary, $new) > 0.75
ORDER BY sim DESC LIMIT 1
```

If match found, return `{ duplicate: true, existing }`. Agent decides whether to supersede or force-insert.

**Files:** `packages/session-store/src/index.ts`, `packages/shared-types/src/index.ts`, `apps/trezor-hive-memory/src/mcp/tools.ts`

## P2.5 — Resilience

### 3. Client-side retry queue for failed MCP requests

When the gateway is unreachable (`store_session_learning`, `session_save`), persist the failed payload to a local file queue (`~/.claude/projects/<project>/mcp-queue.jsonl`). On next session start or a periodic timer, drain the queue by replaying requests against the gateway. Applies to both MCP tool calls and the SessionEnd hook.

## P4 — Future

4. `memory_timeline` — chronological view of learnings + sessions, useful for agent orientation at session start
5. Export/import CLI — `hive-memory export --output backup.jsonl` / `hive-memory import`; essential for team handoffs
6. Hebbian co-activation — increment edge weights when two learnings are co-recalled; boosts link strength over time
