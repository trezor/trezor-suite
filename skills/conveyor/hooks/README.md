# Conveyor hooks — the autonomous safety profile

`conveyor-guard.sh` is a Claude Code [`PreToolUse`](https://docs.claude.com/en/docs/claude-code/hooks) hook. It is the **enforcement layer** behind Conveyor's "never clobber" rules: the skills describe the discipline (force-with-lease, fetch-and-abort, never `reset --hard`, never delete via `gh`), and this hook makes the worst of those mechanical and unbypassable. See the shared [conventions](../CONVENTIONS.md) for the rules it backs and the [README](../README.md) for the workflow it protects.

Skill prose is enough when a human is at the keyboard to confirm an "ask". In **autonomous / overnight routine runs there is no human to confirm**, so the fail-safe has to be code. This is the **Conveyor autonomous safety profile**: wire this hook before you let routines burn pooled tokens unattended.

## What it blocks

The hook reads the proposed `Bash` command and deterministically **denies** (no human prompt, the call never runs) when it matches a destructive form:

| Denied | Why |
| --- | --- |
| `git push --force` / `-f` **without** `--force-with-lease` | bare force clobbers a branch another worker owns; force-with-lease (the Conveyor contract) is allowed |
| `git reset --hard` | discards committed/uncommitted state irreversibly |
| `git checkout [<ref>] [--] .` / `git restore .` | wipes the whole working tree; a named-file checkout/restore is allowed |
| `git branch -D` / `--delete --force` | a branch on `origin` is Conveyor's real lock; `git branch -d` (safe) is allowed |
| `rm -rf` escaping the worktree (absolute path outside `$PWD`, `~`, `/`, `..`) | in-worktree relative deletes are allowed |
| `gh pr merge` / `gh pr close` | merging & closing are **human gates** in Conveyor, never an agent action |
| `gh api -X DELETE` / `--method DELETE`, `gh label delete` | `gh` is Conveyor's control plane; a hallucinated delete of a label/branch/ref is its highest-impact mistake |

`jq` is **required** — the hook reads `.tool_input.command` with it. If `jq` is missing the hook **denies** rather than failing open (a guard that waves everything through on a missing dependency is worse than no guard).

## How to wire it

Add a `PreToolUse` matcher on `Bash` to your `.claude/settings.json`, pointing at this script by absolute path:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "/absolute/path/to/skills/conveyor/hooks/conveyor-guard.sh"
          }
        ]
      }
    ]
  }
}
```

Use the **absolute** path (hooks do not resolve relative to the project). For a routine running in a Conductor workspace, point it at that workspace's checkout of this file. Verify it loads with `/hooks` in the Claude Code session, then confirm a blocked command is denied — e.g. ask it to run `git push --force` and check the call is refused, while `git push --force-with-lease` is allowed.

You can sanity-check the script standalone by piping it a synthetic event:

```bash
printf '%s' '{"tool_name":"Bash","tool_input":{"command":"git reset --hard HEAD~1"}}' \
  | skills/conveyor/hooks/conveyor-guard.sh
# -> {"hookSpecificOutput":{...,"permissionDecision":"deny",...}}
```

No output (exit 0) means the hook has no opinion and the command falls through to Claude Code's normal permission flow.

## Honest residual surface

This hook inspects the **literal `Bash` command string only**. It does **not** catch:

- `sed -i` and other in-place editors;
- a shell function, alias, or wrapper script that hides one of the blocked commands;
- a command assembled in a here-doc or from variables;
- destructive actions taken through the **Edit / Write** tools (file overwrites) rather than `Bash`.

Those still rely on **skill discipline plus the force-with-lease / fetch-and-abort conventions**. The hook is a deterministic backstop for the obvious, high-impact mistakes — not a sandbox. Treat it as defence-in-depth on top of the conventions, not a replacement for them.
