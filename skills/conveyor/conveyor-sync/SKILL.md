---
name: conveyor-sync
description: Keep a worker's local copy of the Conveyor skills current with the home repo and run any pending on-board migrations. Resolves the latest skills/conveyor commit on trezor/trezor-suite, atomically installs it into ~/.claude/skills, and sweeps the GitHub board for any schema migration newer than the last-applied marker. Use when asked to "sync conveyor skills" / "update conveyor", or when a skill's update-check preamble reports the local copy is behind.
---

# conveyor-sync

A **utility** skill, not a belt station — it has no station number and moves no
feature down the [belt](../README.md). It does one job: keep a worker's local copy
of the `conveyor-*` skills current with the **home repo**, and run any pending
on-board migrations so a worker who has been away rejoins a board that may have
moved on. Follow the shared [conventions](../CONVENTIONS.md) for the house rules.

This skill **distributes** approved skills to a worker's machine — it never edits
them. **Skill edits are only ever made via PRs to the home repo**, human-gated at
the PR review per the feedback loop (see [CONVENTIONS.md](../CONVENTIONS.md#improving-the-workflow-friction-capture)).
`conveyor-sync` pulls down what was already approved and merged; if a skill is
wrong, you fix it upstream, not on the worker's disk.

The **home repo** — where the skills live and the canonical copy is tracked — is
**`trezor/trezor-suite`**, path **`skills/conveyor/`** (this answers the README's
"where do the skills live" open question). A worker's install lives under
`~/.claude/skills/`; sync state lives under `~/.conveyor/`.

## When to use

- "sync conveyor skills" / "update conveyor" — a deliberate refresh.
- When a skill's update-check preamble reports the local copy is **behind** the home
  repo (the synced-SHA marker is older than `skills/conveyor`'s tip).
- After a teammate merges a skill change you need locally before running a station.

## Inputs

- **Ref.** Optional — a passed branch / tag / SHA to sync *from*; default is the
  home repo's **default branch** tip.
- **Mode.** Interactive only (it is a utility — see [Modes](#modes)).

## Process

### 1. Resolve the target commit

Resolve the latest commit that touched `skills/conveyor` on the home repo's default
branch (or the passed ref):

```bash
gh api 'repos/trezor/trezor-suite/commits?path=skills/conveyor&per_page=1' --jq '.[0].sha'
```

Compare it to `~/.conveyor/synced-from-sha`. If they match (and no migrations are
pending — step 4), report "already up to date" and stop; there is nothing to install.

### 2. Fetch the target tree

Fetch just the `skills/conveyor` subtree at that commit into a scratch dir — do not
clone the whole monorepo. Either a sparse / path checkout, or the tarball API
sliced to the subpath:

```bash
gh api repos/trezor/trezor-suite/tarball/<sha> > "$tmp/conveyor.tgz"
# extract only the skills/conveyor/* entries into "$tmp/new"
```

### 3. Atomic install (the global install FLATTENS)

The global install **flattens**: every skill dir lands directly under
`~/.claude/skills/<name>`, so the shared `CONVENTIONS.md` and `README.md` — which
the SKILL.md files reference as `../CONVENTIONS.md` / `../README.md` — must also be
copied to **`~/.claude/skills/`** for those parent-relative refs to resolve. Treat
them as install targets exactly like the skill dirs.

Install each `conveyor-*` skill dir plus `CONVENTIONS.md` and `README.md`
**atomically, with rollback**:

1. For each target, move the existing `~/.claude/skills/<name>` to `<name>.bak`.
2. Copy the new one in.
3. On **any** failure mid-install, restore every `.bak` over the half-written copy
   so the worker is never left on a Frankenstein mix of old and new skills — an
   all-or-nothing swap.
4. On success, remove the `.bak` set and record the synced commit:

```bash
echo <sha> > ~/.conveyor/synced-from-sha
```

### 4. Run pending migrations

`skills/conveyor/migrations/` holds **idempotent** scripts, named by date /
sequence (e.g. `2026-06-20-rename-review-label.sh`), each of which sweeps the GitHub
board for a **schema change a skill update assumes** — a label rename, a
status-comment-schema change — and rewrites in-flight items to match
(`gh issue/pr list` → rewrite). They are the **on-board analogue of filesystem
migrations**: they let the board's schema evolve *after* teammates already have live
work on the belt, instead of stranding that work on the old schema.

Run every migration **newer than** the last-applied marker, in order:

```bash
# last applied (empty = none yet)
last=$(cat ~/.conveyor/last-migration 2>/dev/null || echo)
# for each migrations/<name>.sh sorted, where <name> > "$last":
#   run it (idempotent — safe even if a prior run half-applied it)
#   then advance the marker
echo <name> > ~/.conveyor/last-migration
```

Because each migration is idempotent and the marker only advances on success, a
crash mid-sweep is safe to re-run. A migration touches the **board** (the shared
GitHub state), not the worker's disk — so the first worker to sync past a schema
change drags every in-flight item forward for everyone.

### 5. Report

Summarise what changed: the previous and new synced SHA, the commits / skill dirs
that moved, and each migration that ran (and how many board items it rewrote). If
nothing was behind and no migration was pending, say so plainly.

## Modes

- **Interactive only.** This is a utility a worker runs against their own machine;
  there is no belt state to park and no overnight token-pooling to do, so it has no
  autonomous mode. (A routine may *invoke* it as a preflight before draining, but
  the skill itself does not park to a `*:needs-human` state.)

## Rules

- Follow the shared [conventions](../CONVENTIONS.md) — **English only** for anything
  written to GitHub — but most of the locking / label / checkbox machinery does not
  apply here, since `conveyor-sync` touches a worker's local disk and (via
  migrations) only mechanical board rewrites. Plus the rules specific to sync:
- **Distribute, never edit.** This skill copies approved skills onto a machine; it
  never modifies a skill's source. All skill edits go through PRs to the home repo,
  human-gated — `conveyor-sync` is the download, not the authoring.
- **The home repo is `trezor/trezor-suite`, path `skills/conveyor/`.** Resolve and
  fetch from there (or a passed ref), never from a fork or a stale local checkout.
- **Atomic install with rollback.** All-or-nothing: a failed sync restores the prior
  skills from `.bak`, never leaving a half-installed mix.
- **The global install flattens** — copy the shared `CONVENTIONS.md` and `README.md`
  to `~/.claude/skills/` too, or the skills' `../CONVENTIONS.md` refs break.
- **Migrations are idempotent and forward-only.** Run only those newer than
  `~/.conveyor/last-migration`, advance the marker on success, and rely on
  idempotency so a re-run after a crash is safe.
