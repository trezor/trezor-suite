# Trezor Suite mobile E2E tests

This folder contains Detox E2E tests for Trezor Suite mobile app. The tests are prepared for both Android (emulator) and iOS (simulator) platforms. It is possible to run them on local machine in both debug (expo dev-client) and release build. There is also prepared Github CI action (TODO: add link) running them.

## Running tests locally

### Debug build

`detox test -c ios.sim.debug --reuse` # or android.emu.debug

### Release build

## Integration with Trezor-user-env

## CI

-   failed test screenshots
-   run release version

detox clean-framework-cache && detox build-framework-cache

Musí existovat android device!!!
