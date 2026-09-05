#!/usr/bin/env zsh

set -euo pipefail

# Needed for the EPOCHREALTIME variable used in duration measurement.
zmodload zsh/datetime 2>/dev/null || true

readonly SCRIPT_DIR="${0:A:h}"
readonly TESTS_DIR="${SCRIPT_DIR}/src/__tests__"
readonly TEMPLATES_DIR="${SCRIPT_DIR}/src/test-templates"
readonly JEST_BIN="${SCRIPT_DIR}/../../node_modules/.bin/jest"

print_help() {
  cat <<'EOF'
Usage: ./heap-check.sh <number_of_copies> [brk|--brk]

Creates N copies of test templates in src/__tests__, runs Jest heap usage checks,
and removes generated files on exit.

Arguments:
  <number_of_copies>  Positive integer.
  brk, --brk          Run Node with --inspect-brk for debugger attach.

Options:
  -h, --help          Show this help message.
EOF
}

cleanup_generated_tests() {
  find "$TESTS_DIR" -maxdepth 1 -type f \( \
    -name 'basic*.test.tsx' -o \
    -name 'formatter*.test.tsx' -o \
    -name 'store*.test.tsx' \
    -name 'testUtils*.test.tsx' \
  \) -delete
}

validate_args() {
  local num_copies="$1"
  local mode="${2:-}"

  if [[ ! "$num_copies" =~ ^[1-9][0-9]*$ ]]; then
    echo "Error: <number_of_copies> must be a positive integer." >&2
    print_help
    exit 1
  fi

  if [[ -n "$mode" && "$mode" != "brk" && "$mode" != "--brk" ]]; then
    echo "Error: unsupported mode '$mode'. Use 'brk' or '--brk'." >&2
    print_help
    exit 1
  fi
}

run_jest_group() {
  local with_brk="$1"
  local group_name="$2"

  echo
  echo "Running ${group_name} tests..."

  if [[ "$with_brk" == "true" ]]; then
    node --expose-gc --inspect-brk "$JEST_BIN" --runInBand --logHeapUsage "$TESTS_DIR/${group_name}"
  else
    time node --expose-gc "$JEST_BIN" --runInBand --logHeapUsage --no-cache "$TESTS_DIR/${group_name}"
  fi
}

main() {
  if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    print_help
    exit 0
  fi

  if [[ $# -lt 1 || $# -gt 2 ]]; then
    echo "Error: expected 1 or 2 arguments." >&2
    print_help
    exit 1
  fi

  local num_copies="$1"
  local mode="${2:-}"
  local with_brk="false"

  validate_args "$num_copies" "$mode"

  if [[ "$mode" == "brk" || "$mode" == "--brk" ]]; then
    with_brk="true"
  fi

  trap cleanup_generated_tests EXIT INT TERM

  cleanup_generated_tests

  local i
  for ((i = 1; i <= num_copies; i++)); do
    cp "$TEMPLATES_DIR/basic.test.tsx" "$TESTS_DIR/basic${i}.test.tsx"
    cp "$TEMPLATES_DIR/formatter.test.tsx" "$TESTS_DIR/formatter${i}.test.tsx"
    cp "$TEMPLATES_DIR/testUtilsBasic.test.tsx" "$TESTS_DIR/testUtilsBasic${i}.test.tsx"
    cp "$TEMPLATES_DIR/testUtilsStore.test.tsx" "$TESTS_DIR/testUtilsStore${i}.test.tsx"
  done

  run_jest_group "$with_brk" "basic"
  run_jest_group "$with_brk" "formatter"
  run_jest_group "$with_brk" "testUtilsBasic"
  run_jest_group "$with_brk" "testUtilsStore"
  run_jest_group "$with_brk" "testUtils"
}

main "$@"
