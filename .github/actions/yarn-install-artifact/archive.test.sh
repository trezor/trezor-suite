#!/usr/bin/env bash
set -euo pipefail

script_dir=$(cd "$(dirname "$0")" && pwd)
fixture=$(mktemp -d)
trap 'rm -rf "$fixture"' EXIT
mkdir -p "$fixture/source" "$fixture/target" "$fixture/missing"
cd "$fixture/source"
mkdir -p .yarn/cache .git node_modules/.bin 'suite/example space/node_modules' suite/example/src
printf 'state' > .yarn/install-state.gz
printf 'not archived' > .yarn/cache/package.zip
printf 'not archived' > .git/config
printf '#!/bin/sh\nexit 0\n' > node_modules/tool
chmod +x node_modules/tool
ln -s ../tool node_modules/.bin/tool
ln -s ../suite/example node_modules/example
printf 'nested dependency' > 'suite/example space/node_modules/package'
printf 'source' > suite/example/src/index.js

bash "$script_dir/archive.sh" save "$fixture/install.tar.gz"
cd "$fixture/target"
bash "$script_dir/archive.sh" restore "$fixture/install.tar.gz"
test "$(cat .yarn/install-state.gz)" = state
test -x node_modules/tool
test "$(readlink node_modules/.bin/tool)" = ../tool
test "$(readlink node_modules/example)" = ../suite/example
test "$(cat 'suite/example space/node_modules/package')" = 'nested dependency'
test ! -e .yarn/cache/package.zip
test ! -e .git/config
test ! -e suite/example/src/index.js

cd "$fixture/missing"
if bash "$script_dir/archive.sh" save "$fixture/missing.tar.gz"; then
    echo 'Saving an incomplete installation should fail.' >&2
    exit 1
fi
if bash "$script_dir/archive.sh" invalid "$fixture/install.tar.gz" 2>/dev/null; then
    echo 'Unknown operations should fail.' >&2
    exit 1
fi
printf 'Installation archive round-trip and failure cases passed.\n'
