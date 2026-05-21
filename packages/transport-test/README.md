This package contains a collection of end-to-end tests of the transport layer using both emulators and real devices.

### Bridge tests

|                                                           | needs tenv | manually connect device | manually start bridge |
| --------------------------------------------------------- | ---------- | ----------------------- | --------------------- |
| yarn workspace @trezor/transport-test test:e2e:bridge:hw  | no         | yes                     | no                    |
| yarn workspace @trezor/transport-test test:e2e:bridge:emu | yes        | no                      | no                    |
