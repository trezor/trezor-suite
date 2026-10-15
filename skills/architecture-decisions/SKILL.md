---
name: architecture-decisions
description:
    Follow accepted Architecture Decision Records when planning, implementing, or reviewing changes.
    Use the ADR index to identify which decisions apply to the task.
---

# Architecture decisions

Before choosing an approach, check the ADR index below. Read each ADR in full if its scope or
reading conditions match the task. Recheck the index if the task expands to other areas.

Follow applicable accepted decisions and constraints, even where existing code uses older patterns.
Apply them within the task's scope; do not start unrelated migrations. If a task conflicts with an
accepted ADR, explain the conflict and link to the decision. Use the
[ADR process](../../docs/adr/README.md) to propose a replacement when a decision needs to change. Do
not rewrite accepted decisions.

## ADR index

The index routes reading; the ADRs define the decisions. Proposed ADRs are context only and must
not be enforced as accepted decisions.

| ADR                                                                                                                         | Status   | Applies to                                                                                                           | Read when                                                                                                                            |
| --------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| [ADR-001: Separate application composition from reusable building blocks](../../docs/adr/001-separate-app-and-lego-code.md) | Accepted | Suite app composition, reusable packages, and network modules.                                                       | Adding, moving, or splitting packages; changing dependencies or app wiring; deciding where reusable code belongs.                    |
| [ADR-002: Ubiquitous Language](../../docs/adr/002-ubiquitous-language.md)                                                   | Proposed | Domain terminology, the [glossary](../../docs/ubiquitous-language.md), and associated TypeScript types across Suite. | Naming or modeling networks, network families, native tokens, or non-native tokens; changing glossary entries or their linked JSDoc. |

## Keep the index current

Add or update an entry in the same PR that introduces or accepts an ADR. Keep its status, scope,
and reading conditions in sync with the decision. Replace superseded entries with their successors
and remove rejected proposals. Neither rejected nor superseded decisions are binding.
