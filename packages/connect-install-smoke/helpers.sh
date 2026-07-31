#!/usr/bin/env bash
# Shared helpers for connect install-smoke scripts.
# Source from bash; do not execute directly.

SMOKE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SMOKE_FIXTURES_DIR="$SMOKE_DIR/fixtures"

log_step() {
    echo ""
    echo "=== $* ==="
}

manifest_field() {
    node -e '
        const m = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
        const v = m[process.argv[2]];
        if (v === undefined || v === null) process.exit(0);
        process.stdout.write(typeof v === "string" ? v : JSON.stringify(v));
    ' "$1" "$2"
}

# Run one fixture-scenario combination end-to-end.
#
# Usage:
#   run_install_smoke <fixture-name> <scenario> [op1 op2 ...]
#
# Scenarios: registry-npm | registry-yarn | local
# Ops: type-check, runtime (defaults to "runtime" if none given).
#
# Required env per scenario:
#   registry-npm | registry-yarn -> PACKAGE_VERSION
#   local                        -> PACKED_PACKAGES_DIR, OVERRIDES_FILE
#
# Runs in a fresh sub-directory under the current working directory.
run_install_smoke() {
    local fixture_name="$1"
    local scenario="$2"
    shift 2
    local ops=("$@")
    if [ "${#ops[@]}" -eq 0 ]; then
        ops=("runtime")
    fi

    local fixture_src="$SMOKE_FIXTURES_DIR/$fixture_name"
    local manifest="$fixture_src/manifest.json"
    if [ ! -f "$manifest" ]; then
        echo "Fixture manifest not found: $manifest" >&2
        return 1
    fi

    local with_type_check="false"
    local has_runtime="false"
    for op in "${ops[@]}"; do
        case "$op" in
            type-check) with_type_check="true" ;;
            runtime) has_runtime="true" ;;
            *) echo "Unknown op: $op" >&2; return 1 ;;
        esac
    done

    log_step "Fixture: $fixture_name (scenario: $scenario, ops: ${ops[*]})"

    rm -rf "$fixture_name"
    mkdir "$fixture_name"
    (
        cd "$fixture_name" || exit 1
        cp -r "$fixture_src"/. .
        rm -f manifest.json

        local render_args=(
            --fixture-dir "$fixture_src"
            --scenario "$scenario"
        )
        if [ "$with_type_check" = "true" ]; then
            render_args+=(--with-type-check)
        fi
        case "$scenario" in
            registry-npm|registry-yarn)
                render_args+=(--version "${PACKAGE_VERSION:?PACKAGE_VERSION required for $scenario}")
                ;;
            local)
                render_args+=(--overrides-file "${OVERRIDES_FILE:?OVERRIDES_FILE required for local}")
                render_args+=(--packed-dir "${PACKED_PACKAGES_DIR:?PACKED_PACKAGES_DIR required for local}")
                ;;
            *)
                echo "Unknown scenario: $scenario" >&2
                exit 1
                ;;
        esac

        node "$SMOKE_DIR/render-package-json.ts" "${render_args[@]}" > package.json
        cat package.json

        case "$scenario" in
            registry-npm|local)
                npm install
                ;;
            registry-yarn)
                touch yarn.lock
                # node-modules linker so subsequent steps can call
                # ./node_modules/.bin/tsc and node index.mjs directly,
                # the same way the npm scenarios do.
                # enableHardenedMode: false because Yarn auto-enables it for
                # public-PR workflows and then refuses to populate the empty
                # lockfile we just seeded (YN0028).
                cat > .yarnrc.yml <<'YARNRC'
nodeLinker: node-modules
npmMinimalAgeGate: 0
enableHardenedMode: false
YARNRC
                yarn install
                ;;
        esac

        if [ "$with_type_check" = "true" ]; then
            log_step "Type-checking $fixture_name"
            ./node_modules/.bin/tsc --noEmit --project tsconfig.json
        fi

        if [ "$has_runtime" = "true" ]; then
            local runtime_entry
            runtime_entry="$(manifest_field "$manifest" runtimeEntry)"
            if [ -z "$runtime_entry" ]; then
                echo "Fixture $fixture_name has no runtimeEntry but runtime op was requested." >&2
                exit 1
            fi
            log_step "Running $fixture_name ($runtime_entry)"
            node "$runtime_entry"
        fi
    )
}
