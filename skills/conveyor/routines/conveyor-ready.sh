#!/usr/bin/env bash
# conveyor-ready.sh — list parked Conveyor items whose "✅ Done" box is ticked,
# i.e. items a human has finished answering and that are ready for a drain run.
#
# This is a READ-ONLY filter. It does NOT drain anything itself — draining is an
# agent action (running the matching conveyor skill). A routine runs this script,
# then drives each printed item through its drain skill (see the README).
#
#   REPO=owner/name ./conveyor-ready.sh
#
# Output: one `kind:number` per ready item, e.g.
#   plan:1     -> drain with conveyor-2-plan-review on issue 1
#   impl:5     -> drain with conveyor-3-implement on PR 5
#   review:7   -> drain with conveyor-4-review on PR 7
# Plus held-lock candidates for stale-takeover (NOT Done-gated — the matching skill's
# step-0 decides live-vs-stale and leaves a fresh lock alone):
#   lock-plan:3   -> conveyor/plan:in-review held; conveyor-2-plan-review reconciles if stale
#   lock-review:8 -> conveyor/review:in-progress held; conveyor-4-review reconciles if stale
#   lock-impl:9   -> conveyor/impl:in-progress held; conveyor-3-implement reconciles if stale
set -u
REPO="${REPO:?set REPO=owner/name (e.g. REPO=mroz22/conveyor-sandbox)}"

# Is the "✅ Done — agent, pick this up" checkbox ticked in any status comment?
# $1 = issue|pr, $2 = number  -> exit 0 if ticked.
done_ticked() {
  gh "$1" view "$2" --repo "$REPO" --json comments \
     --jq '.comments[].body' 2>/dev/null \
   | grep -qiE '^[[:space:]]*- \[x\].*done'
}

# Plan decisions are parked on the ISSUE.
gh issue list --repo "$REPO" --label conveyor/plan:needs-human --state open \
   --json number --jq '.[].number' \
 | while read -r n; do done_ticked issue "$n" && echo "plan:$n"; done

# Implementation give-ups and review findings are parked on the PR.
for kind in impl review; do
  gh pr list --repo "$REPO" --label "conveyor/$kind:needs-human" --state open \
     --json number --jq '.[].number' \
   | while read -r n; do done_ticked pr "$n" && echo "$kind:$n"; done
done

# Held-lock candidates for stale-takeover — surfaced for ALL holders (not Done-gated).
# The matching skill's step-0 decides whether the lock is stale (a crashed run, take it
# over) or fresh (another run is working, leave it). A scan that omits these lets a
# crashed in-review / in-progress lock sit stuck forever.
gh issue list --repo "$REPO" --label conveyor/plan:in-review --state open \
   --json number --jq '.[].number' \
 | while read -r n; do echo "lock-plan:$n"; done
for kind in impl review; do
  gh pr list --repo "$REPO" --label "conveyor/$kind:in-progress" --state open \
     --json number --jq '.[].number' \
   | while read -r n; do echo "lock-$kind:$n"; done
done

# A filter is not a failure when nothing is ready / nothing is ticked.
exit 0
