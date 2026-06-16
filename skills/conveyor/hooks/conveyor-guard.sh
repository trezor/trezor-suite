#!/usr/bin/env bash
# conveyor-guard.sh — a Claude Code PreToolUse hook (matcher: Bash) that
# DETERMINISTICALLY BLOCKS a small set of destructive commands, so Conveyor's
# "never clobber" rules are ENFORCED, not just hoped-for.
#
# Why a hook and not just skill prose: in autonomous / overnight runs there is no
# human to confirm an "ask", so a fail-safe must be code. The conveyor skills say
# "force-with-lease, fetch-and-abort, never reset --hard, never delete via gh" —
# this hook makes the worst of those mechanical and unbypassable for the agent.
#
# THREAT MODEL (what this stops):
#   - a hallucinated `git push --force` clobbering a branch another worker owns
#     (force-with-lease is the contract; bare --force / -f is denied);
#   - a `git reset --hard` / `git checkout -- .` / `git restore .` nuking
#     uncommitted work mid-run;
#   - a `git branch -D` of a branch that is the real lock;
#   - an `rm -rf` that escapes the worktree (absolute path, ~, /, ..);
#   - `gh pr merge` / `gh pr close` — merging & closing are HUMAN gates in
#     Conveyor, never an agent action;
#   - `gh api -X DELETE` / `gh label delete` — gh is Conveyor's control plane;
#     a hallucinated delete of a label/branch/ref is its highest-impact mistake.
#
# HONEST RESIDUAL SURFACE (what this does NOT stop):
#   It inspects the LITERAL Bash command string only. It will NOT catch
#   `sed -i`, a shell function / alias / wrapper script that hides one of the
#   above, a here-doc-built command, or destructive actions taken through the
#   Edit / Write tools (file overwrites) rather than Bash. Those still rely on
#   skill discipline + the force-with-lease / fetch-and-abort conventions. This
#   hook is a backstop for the obvious, not a sandbox.
#
# PROTOCOL: stdin = the PreToolUse JSON event ({.tool_name, .tool_input...});
# for Bash the command is at `.tool_input.command`. To BLOCK, print a deny
# decision on stdout and exit 0. To ALLOW, exit 0 with no output.
#
# jq IS REQUIRED. A guard must not fail open: if jq is missing we cannot read the
# command, so we DENY (and say why) rather than wave everything through.
set -u

deny() {
  # $1 = human-readable reason
  jq -cn --arg reason "$1" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: ("Conveyor guard: " + $reason)
    }
  }'
  exit 0
}

# allow = exit silently; Claude Code treats no output as "no opinion".
allow() { exit 0; }

command -v jq >/dev/null 2>&1 || {
  printf '%s\n' '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Conveyor guard: jq is not installed; the guard cannot inspect the command and refuses to fail open. Install jq."}}'
  exit 0
}

EVENT="$(cat)"
TOOL="$(printf '%s' "$EVENT" | jq -r '.tool_name // empty')"

# Only Bash carries a shell command; anything else is out of this hook's scope.
[ "$TOOL" = "Bash" ] || allow

CMD="$(printf '%s' "$EVENT" | jq -r '.tool_input.command // empty')"
[ -n "$CMD" ] || allow

# Normalise whitespace to single spaces so multi-line / oddly-spaced commands
# match the same patterns. (Best-effort — see the residual-surface note above.)
NORM="$(printf '%s' "$CMD" | tr '\n\t' '  ' | tr -s ' ')"

# --- git push --force / -f WITHOUT --force-with-lease ------------------------
# force-with-lease is the Conveyor contract and is allowed; bare force is not.
if printf '%s' "$NORM" | grep -qE '(^|[;&|]|&&)[[:space:]]*git[[:space:]].*\bpush\b'; then
  if printf '%s' "$NORM" | grep -qE '\bpush\b.*(--force([^-]|$)|(^| )-[A-Za-z]*f)' \
     && ! printf '%s' "$NORM" | grep -qE '\-\-force-with-lease'; then
    deny "bare 'git push --force/-f' can clobber a branch another worker owns. Conveyor only allows 'git push --force-with-lease' (fetch-and-abort first). If you lost the lease, stop and reconcile — do not force."
  fi
fi

# --- git reset --hard -------------------------------------------------------
if printf '%s' "$NORM" | grep -qE '\bgit\b.*\breset\b.*--hard'; then
  deny "'git reset --hard' discards committed/uncommitted state irreversibly. Conveyor never does this in a run; reconcile instead."
fi

# --- git checkout / restore that discards the whole working tree ------------
# Deny the wipe-everything forms; a checkout/restore of a *named* file is fine.
# Catches `git checkout .`, `git checkout -- .`, and `git checkout <ref> -- .`
# (all reset the whole tree); a `git checkout <ref> -- path/to/file` is fine.
if printf '%s' "$NORM" | grep -qE '\bgit\b.*\bcheckout\b.*(^|[[:space:]])(--[[:space:]]+)?\.([[:space:]]|$)'; then
  deny "'git checkout [<ref>] [--] .' discards the entire working tree. Conveyor never wipes uncommitted work; commit or reconcile instead."
fi
if printf '%s' "$NORM" | grep -qE '\bgit\b.*\brestore\b'; then
  if printf '%s' "$NORM" | grep -qE '\brestore\b([[:space:]]+--[A-Za-z-]+)*[[:space:]]+\.([[:space:]]|$)'; then
    deny "'git restore .' (incl. --staged --worktree .) discards the entire working tree. Conveyor never wipes uncommitted work; commit or reconcile instead."
  fi
fi

# --- git branch -D / --delete --force ---------------------------------------
# A branch is the REAL lock in Conveyor — force-deleting one destroys state.
# Catches -D, the combined short forms (-Df / -fd / -df), and the long
# --delete + --force pair in either order. A plain -d (safe delete) is allowed.
if printf '%s' "$NORM" | grep -qE '\bgit\b.*\bbranch\b.*((^| )-[A-Za-z]*D[A-Za-z]*|(^| )-[A-Za-z]*d[A-Za-z]*f|(^| )-[A-Za-z]*f[A-Za-z]*d|--delete[[:space:]]+.*--force|--force[[:space:]]+.*--delete)'; then
  deny "'git branch -D / --delete --force' force-deletes a branch — but a branch on origin is Conveyor's real lock. Do not force-delete; reconcile instead."
fi

# --- rm -rf that escapes the current worktree -------------------------------
# Allow in-worktree relative targets; deny absolute-outside-PWD, ~, /, .. .
if printf '%s' "$NORM" | grep -qE '\brm\b([[:space:]]+-[A-Za-z]*r[A-Za-z]*f|[[:space:]]+-[A-Za-z]*f[A-Za-z]*r|[[:space:]]+-r[[:space:]]+-f|[[:space:]]+-f[[:space:]]+-r)'; then
  # Pull out the rm invocation's tail (everything after the first 'rm ').
  RM_TAIL="${NORM#*rm }"
  # Inspect each whitespace-separated token; flags start with '-'.
  for tok in $RM_TAIL; do
    case "$tok" in
      -*) continue ;;                 # a flag, not a path
      \~|\~/*)
        deny "'rm -rf' targeting a home-relative path ('$tok') can escape the worktree. Only delete clearly in-worktree relative paths." ;;
      /|/*)
        # Absolute path: allowed only if it is under $PWD.
        case "$tok" in
          "$PWD"|"$PWD"/*) : ;;       # inside the worktree — fine
          *) deny "'rm -rf' targeting an absolute path outside the current worktree ('$tok') is blocked. Only delete in-worktree paths." ;;
        esac ;;
      *..*)
        deny "'rm -rf' with a parent-traversal path ('$tok') can escape the worktree. Only delete clearly in-worktree relative paths." ;;
      *) : ;;                          # a plain in-worktree relative path — fine
    esac
  done
fi

# --- gh pr merge / gh pr close (human-only gates) ---------------------------
if printf '%s' "$NORM" | grep -qE '\bgh\b[[:space:]]+pr[[:space:]]+(merge|close)\b'; then
  deny "'gh pr merge' / 'gh pr close' is a HUMAN gate in Conveyor — agents never merge or close a PR. Hand off via labels instead."
fi

# --- gh api -X DELETE / --method DELETE, and gh label delete ----------------
if printf '%s' "$NORM" | grep -qE '\bgh\b[[:space:]]+api\b' \
   && printf '%s' "$NORM" | grep -qiE '(-X[[:space:]]+DELETE|--method[[:space:]]+DELETE|--method=DELETE|-XDELETE)'; then
  deny "'gh api -X DELETE' deletes labels/branches/refs via REST. gh is Conveyor's control plane — a hallucinated delete is the highest-impact mistake. Blocked."
fi
if printf '%s' "$NORM" | grep -qE '\bgh\b[[:space:]]+label[[:space:]]+delete\b'; then
  deny "'gh label delete' removes a Conveyor lifecycle label the whole board depends on. Blocked — labels are managed by the one-time human bootstrap."
fi

# Nothing matched — no opinion, let Claude Code's normal permission flow decide.
allow
