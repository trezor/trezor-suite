---
name: trezor-hive-memory
description: This repo has a shared knowledge graph (trezor-hive-memory) available via MCP. Use it as the primary knowledge source in every session.
---

## On session start

- Use `recall_learnings` to search for existing knowledge relevant to the current task before starting work.
- Use `get_dependency_impact` when investigating how a change propagates through the monorepo, before manually tracing imports.
- Use `recall_related` to traverse the knowledge graph from a symbol or previous learning to find cross-cutting insights.

## While working

- After resolving a non-trivial bug, discovering a codebase pattern, or making an architectural decision, call `store_session_learning` with:
    - `summary`: concise description of the insight
    - `tags`: relevant package names, domains (e.g. `["@trezor/connect", "transport", "bug"]`)
    - `engineerId`: the engineer you are pairing with (if known)
    - `relatedSymbols`: fully-qualified symbol names involved
    - `detail`: extended context when the summary alone is not enough
- Use `get_learning` to fetch full details of a specific learning found via `recall_learnings`.

## On session end

- Call `session_save` with:
    - `title`: short summary of what the session accomplished
    - `summary`: detailed description of what was done
    - `nextSteps`: actionable items for the next session
    - `learningIds`: UUIDs of learnings produced during this session
    - `tags`: relevant domains

## Available MCP tools

| Tool                     | Purpose                                                  |
| ------------------------ | -------------------------------------------------------- |
| `store_session_learning` | Store a learning/insight into PG + Neo4j                 |
| `recall_learnings`       | Full-text search learnings (query, tags, engineer, date) |
| `get_learning`           | Get full detail of a single learning by UUID             |
| `session_save`           | Save structured session summary for continuity           |
| `recall_related`         | Traverse Neo4j graph from learning/symbol                |
| `get_dependency_impact`  | Analyse transitive dependency impact                     |

## What to store

The graph is a **knowledge base**, not a task tracker. Store durable insights that help future sessions.

- Bug root causes and fixes
- Non-obvious codebase conventions or gotchas
- Architectural decisions and their rationale
- Performance findings
- Cross-package dependency insights

## What NOT to store

- **Todos, followups, or backlog items** — use GitHub Issues or Linear instead
- **Session-specific noise** — file paths opened, commands run, in-progress state
- **Trivial changes** — typo fixes, import reordering
- **Anything already documented** in project skills

## Updating existing knowledge

When a learning from a previous session is improved, corrected, or superseded:

- Use `recall_learnings` first to check if similar knowledge already exists
- Reference the original insight in `detail` (e.g. "supersedes: <summary of original>")
- Use the same `tags` and `relatedSymbols` so the graph links them together
- Do NOT create duplicates — if you are restating something already stored, add new context to it rather than creating a separate entry
