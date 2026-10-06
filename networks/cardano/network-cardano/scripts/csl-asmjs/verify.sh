#!/usr/bin/env bash
# Rebuilds generated/csl-asmjs/ from scratch and fails unless the result is byte-identical to the
# committed files. See README.md.
set -euo pipefail

cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.."
output_dir=generated/csl-asmjs

# Force a rebuild and expose committed files the generator no longer writes.
rm -rf -- "$output_dir"
yarn generate:csl-asmjs

status=$(git status --porcelain --untracked-files=all -- "$output_dir")
if [[ -n "$status" ]]; then
    printf 'csl-asmjs: rebuilt output differs from the committed files:\n%s\n' \
        "$status" >&2
    git diff --stat -- "$output_dir"
    exit 1
fi

printf '%s\n' 'csl-asmjs: rebuilt output is identical to the committed files'
