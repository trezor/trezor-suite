# Dead code detection

We detect dead code with two complementary tools, split by what each can actually prove.

## Two layers

### 1. `no-unused-intersection-members` (ESLint, blocking)

A type-aware local ESLint rule (`eslint-local-rules/no-unused-intersection-members`) that proves a
_member_ of a local contract type (`*State` / `*Deps`, thunk state/extra, `create*` deps) is safe to
remove. It is file-local, prefers false negatives, and runs as a blocking CI gate in the `Lint JS`
step (only when `ESLINT_RUN_EXPENSIVE_CHECKS=true`, which CI sets; editor/local lint skips it).

It sees dead **members**. It is blind to dead **files**, **dependencies**, whole **exports** and
**enum members** — because a file-local analysis cannot see a cross-package consumer.

### 2. `knip` (advisory)

[Knip](https://knip.dev) builds the cross-package module graph over all workspaces and finds the
adjacent classes the member rule cannot: unused files, unused dependencies, unused exports/types and
unused enum members. Because it resolves the graph across packages, a symbol exported by one package
and imported by another counts as used — which avoids the cross-package false positives that make a
naive "find references" sweep unusable here.

Config lives in [`knip.jsonc`](../../knip.jsonc); it runs via the
[`[Check] Dead code (advisory)`](../../.github/workflows/check-dead-code.yml) workflow (weekly +
`workflow_dispatch`).

## Running it locally

```bash
yarn knip                      # full report, all enabled issue types
yarn knip --reporter markdown  # markdown (what CI posts to the job summary)
yarn knip --include files      # a single issue type
yarn knip --workspace packages/utils   # scope to one workspace
```

## Posture: advisory first

Every reported issue type is `warn`, so `yarn knip` exits `0` even with findings and the workflow
never blocks a build. This is deliberate: on a 300+ workspace repo the first runs carry noise
(deep public entry points, plugin-specific entries) that has to be triaged before any of it can gate
a PR.

Triaging a finding means one of:

- **Real dead code** → delete it in a normal PR.
- **A legitimate entry point** knip cannot infer (a deep public export beyond the barrel, a
  script referenced only by CI) → add it to `entry` in `knip.jsonc`.
- **An off-repo / undecidable consumer** (external API-shape mirror, persisted migration schema,
  vendored fork, serialized wire/analytics payload) → add it to `ignoreFiles` / `ignoreWorkspaces`.

## Graduating to a blocking gate

Once a subtype reaches a clean baseline, promote it:

1. In `knip.jsonc`, change that issue type from `"warn"` to `"error"`.
2. Add a PR-triggered job (or fold it into an existing check) that runs `yarn knip --include <type>`
   and drop `continue-on-error`.

`files` and `dependencies` are the natural first candidates — they are near-100% precise once the
baseline is clean. `exports` / `types` / `enumMembers` settle more slowly and should stay advisory
until their entry patterns are tuned.
