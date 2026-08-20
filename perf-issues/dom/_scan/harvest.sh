#!/usr/bin/env bash
# Phase 0 candidate harvest for the performance-dom audit.
# Scans web/desktop source only (suite-native has no DOM). Excludes tests, stories,
# e2e, fixtures, mocks, docs and the perf-issues/skills trees themselves.
set -euo pipefail
cd /Users/jiri.cermak/dev/satoshilabs/trezor/trezor-suite

rg () { (exec -a rg "${CLAUDE_CODE_EXECPATH:-/Users/jiri.cermak/.local/bin/claude}" "$@"); }

OUT=perf-issues/dom/_scan/00-candidates.md
mkdir -p perf-issues/dom/_scan

EX=(
  -g '!suite-native/**'
  -g '!**/*.test.*'
  -g '!**/*.stories.*'
  -g '!**/e2e/**'
  -g '!**/__fixtures__/**'
  -g '!**/__mocks__/**'
  -g '!**/fixtures/**'
  -g '!docs/**'
  -g '!perf-issues/**'
  -g '!skills/**'
  -g '!ci/**'
  -g '!**/*.md'
  -g '!**/webpack/**'
  -g '!**/scripts/**'
)
ROOTS=(packages suite suite-common)

section () {
  local title="$1"; shift
  local pattern="$1"; shift
  echo "" >> "$OUT"
  echo "### $title" >> "$OUT"
  echo "" >> "$OUT"
  echo '```' >> "$OUT"
  rg -n --no-messages -t ts "$pattern" "${ROOTS[@]}" "${EX[@]}" "$@" \
    | sed 's/[[:space:]]*$//' >> "$OUT" || echo "(no hits)" >> "$OUT"
  echo '```' >> "$OUT"
}

cat > "$OUT" <<'HEADER'
# Phase 0 — raw candidate harvest (grep, unverified)

Generated mechanically; every hit below still needs human/agent verification against
[`skills/performance-dom/SKILL.md`](../../../skills/performance-dom/SKILL.md).
Scope: `packages/`, `suite/`, `suite-common/` — web/desktop only. `suite-native/`,
tests, stories, e2e, fixtures and mocks are excluded.

Regenerate with the script embedded in the PROGRESS.md history (harvest.sh).
HEADER

echo "" >> "$OUT"
echo "## A. Forced-layout geometry reads" >> "$OUT"
section "A1. getBoundingClientRect / getClientRects" 'getBoundingClientRect|getClientRects'
section "A2. offset\$x reads" '\.offset(Width|Height|Top|Left|Parent)\b'
section "A3. client\$x reads" '\.client(Width|Height|Top|Left)\b'
section "A4. scroll\$x geometry props (read or write)" '\.scroll(Width|Height|Top|Left)\b'
section "A5. scroll methods" 'scrollIntoView|\.scrollTo\(|\.scrollBy\('
section "A6. innerText" '\.innerText\b'
section "A7. getComputedStyle" 'getComputedStyle'
section "A8. elementFromPoint / caret APIs" 'elementFromPoint|caretRangeFromPoint|caretPositionFromPoint'
section "A9. window geometry reads" 'window\.(innerWidth|innerHeight|scrollY|scrollX|pageYOffset|pageXOffset)|visualViewport'

echo "" >> "$OUT"
echo "## B. requestAnimationFrame use" >> "$OUT"
section "B1. requestAnimationFrame" 'requestAnimationFrame'

echo "" >> "$OUT"
echo "## C. CSS transitions and animations" >> "$OUT"
echo "" >> "$OUT"
echo "C0 is the authoritative superset (styled-components declarations wrap across lines, so" >> "$OUT"
echo "targeted single-line regexes under-match); C1–C3 are targeted views into it." >> "$OUT"
echo "Vendored CSS is out of scope: \`packages/blockchain-link/src/ui/spectre.min.css\`," >> "$OUT"
echo "\`packages/connect-explorer-theme/css/*\` (forked Nextra theme)." >> "$OUT"

echo "" >> "$OUT"
echo "### C0. every transition-ish line (superset, needs classification)" >> "$OUT"
echo "" >> "$OUT"
echo '```' >> "$OUT"
rg -n --no-messages -t ts 'transition' "${ROOTS[@]}" "${EX[@]}" -g '!**/*.d.ts' \
  | grep -v 'transitionProps\|Transition\b\|useTransition\|startTransition\|transitionEnd\|transitionend\|ViewTransition' \
  | sed 's/[[:space:]]*$//' >> "$OUT" || echo "(no hits)" >> "$OUT"
echo '```' >> "$OUT"

section "C1. transition: all / bare-duration shorthand" 'transition:\s*(all\b|[0-9])'
section "C2. transition-property: all" 'transition-property:\s*all'
section "C3. transitions naming layout properties" 'transition[^;:]*:[^;]*\b(width|height|top|left|right|bottom|margin|padding|flex-basis|flex-grow|gap|font-size|inset|line-height)\b'
section "C4. keyframes declarations" 'keyframes\s'
section "C5. animation shorthand lines" 'animation:\s'

echo "" >> "$OUT"
echo "## D. Scroll/resize listeners and observers (context for A)" >> "$OUT"
section "D1. scroll/resize event listeners" "addEventListener\(['\"](scroll|resize)"
section "D2. existing observers (ground truth, mostly good)" 'new (ResizeObserver|IntersectionObserver|MutationObserver)'

echo "done: $OUT"
wc -l "$OUT"
