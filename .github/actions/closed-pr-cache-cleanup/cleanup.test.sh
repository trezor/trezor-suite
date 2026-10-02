#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd "$(dirname "$0")" && pwd)
fixture=$(mktemp -d)
trap 'rm -rf "$fixture"' EXIT
mkdir "$fixture/bin"
cat > "$fixture/bin/gh" <<'MOCK'
#!/usr/bin/env bash
set -euo pipefail
case "$*" in
    *actions/caches?*)
        printf '1\trefs/heads/develop\t100\n2\trefs/pull/10/merge\t200\n3\trefs/pull/11/merge\t300\n4\trefs/pull/10/merge\t400\n5\trefs/heads/feature\t500\n'
        ;;
    *pulls/10*) printf 'closed\n' ;;
    *pulls/11*)
        if [[ "${FAIL_PR_LOOKUP:-false}" == true ]]; then exit 1; fi
        printf 'open\n'
        ;;
    *'--method DELETE'*) printf '%s\n' "${*: -1}" >> "$DELETE_LOG" ;;
    *) exit 1 ;;
esac
MOCK
chmod +x "$fixture/bin/gh"
export PATH="$fixture/bin:$PATH"
export DELETE_LOG="$fixture/deleted"
export CACHE_REPOSITORY=trezor/trezor-suite

bash "$script_dir/cleanup.sh" > "$fixture/dry-run"
test ! -e "$DELETE_LOG"
test "$(wc -l < "$fixture/dry-run" | tr -d ' ')" = 2
CACHE_DELETE=true bash "$script_dir/cleanup.sh" > /dev/null
printf 'repos/trezor/trezor-suite/actions/caches/2\nrepos/trezor/trezor-suite/actions/caches/4\n' > "$fixture/expected"
cmp "$fixture/expected" "$DELETE_LOG"
: > "$DELETE_LOG"
CACHE_DELETE=true CACHE_PR_NUMBER=11 bash "$script_dir/cleanup.sh" > /dev/null
test ! -s "$DELETE_LOG"
if CACHE_PR_NUMBER=invalid bash "$script_dir/cleanup.sh" > /dev/null 2>&1; then exit 1; fi
if FAIL_PR_LOOKUP=true bash "$script_dir/cleanup.sh" > /dev/null 2>&1; then exit 1; fi
printf 'Closed-PR cleanup scope, dry-run, filtering, and lookup failure cases passed.\n'
