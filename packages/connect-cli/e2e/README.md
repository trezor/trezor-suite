# Encrypted WARD end-to-end tests

These are the `ward-poc-encrypted` ports of `ward-queue.sh` and `ward-wardd.sh`
from `ward-draft`. They run the encrypted protocol's device scenarios through
trezorlib, using the firmware checkout's pytest fixtures for seed setup,
confirmation screens and cleanup. They do not invoke Connect's CLI.

In a firmware checkout of `petrsusil/ward-poc-encrypted`, enter `nix-shell`,
run `uv sync`, and build a Safe 5 debug emulator:

```sh
uv run xtask build firmware --emulator -m T3T1 -p test-live
```

In this Suite checkout, install dependencies with `yarn --immutable`. Then,
from the same Nix environment, run:

```sh
export TREZOR_FIRMWARE=/path/to/trezor-firmware
./packages/connect-cli/e2e/ward-queue.sh
./packages/connect-cli/e2e/ward-wardd.sh
```

Each script starts and stops its own headless emulator with an empty temporary
profile and a free block of seven UDP ports above 30000. To choose the block,
set `TREZOR_UDP_PORT`; a busy block is rejected. `PYTHON` can override the default
`$TREZOR_FIRMWARE/.venv/bin/python`. Extra arguments are passed to pytest, for
example `-x`. Skips and empty selections do not count as success. The scripts
do not build firmware or change an existing emulator profile.

- `ward-queue.sh` exercises insert/update/delete, membership and absence proofs,
  distinct pending IDs, counter advancement only on
  WM confirmation, rejected confirmations retaining queued work, discard and
  requeue, batch commits and authenticated rollback. The host stores the exact
  encrypted leaves returned by the device.
- `ward-wardd.sh` starts a real Node `packages/wardd/src/cli.ts` per scenario,
  with a temporary in-memory replica, debug WM, token and port. It verifies
  write/lookup/update/delete, a branching multi-entry trie, and the native
  address display through the Python WebSocket adapter.

The queue runner deselects the firmware's unfinished `test_ward_get_address_label`
input-flow placeholder. The executable display scenario is covered by
`ward-wardd.sh` instead; every selected test must run and pass.

This branch uses `WARDQueueUpdate` / `WARDPerformUpdate` /
`WARDConfirmedByWM`, rather than the draft's `WardQueueSetEntry` / flush API.
The draft's queue backup/restore, pinned application role, dedicated service
channel, two-writer daemon chain, and Rust/Java relay smoke tests are not part
of these ports. Multi-entry batches currently support shape-preserving updates;
the queue suite also checks rejection of a batch that would insert a new path.
