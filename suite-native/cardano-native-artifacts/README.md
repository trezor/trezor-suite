# Cardano Native Artifacts

This package contains prebuilt Cardano serialization native artifacts consumed by
Suite Native through `@emurgo/csl-mobile-bridge`.

Normal app development and CI must not rebuild these artifacts from Rust. Rebuild
them only when updating `@emurgo/csl-mobile-bridge` or the underlying Cardano
serialization library.

## Updating The Artifacts

1. Build the Android `.so` files and iOS `CardanoSerialization.xcframework`
   outside the normal app CI.
2. Replace the files in this package.
3. Run `shasum -a 256 -c CHECKSUMS.txt` before changing anything, then update
   `CHECKSUMS.txt` after replacing the artifacts.
4. Run `yarn install`.
5. Commit the manifest, lockfile, patch, checksum and LFS pointer changes.
6. Push the LFS objects with `git lfs push --all origin HEAD`.

Normal app builds must not require Rust, `cargo`, `rustup`, Polygen or Hermes
WASM.
