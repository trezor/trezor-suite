This package contains a collection of end-to-end tests of the transport layer using both emulators and real devices.

### Bridge tests

|                                                               | needs tenv | manually connect device | manually start bridge |
| ------------------------------------------------------------- | ---------- | ----------------------- | --------------------- |
| yarn workspace @trezor/transport-test test:e2e:old-bridge:hw  | no         | yes                     | yes                   |
| yarn workspace @trezor/transport-test test:e2e:old-bridge:emu | yes        | no                      | no                    |
| yarn workspace @trezor/transport-test test:e2e:new-bridge:hw  | no         | yes                     | no                    |
| yarn workspace @trezor/transport-test test:e2e:new-bridge:emu | yes        | no                      | no                    |
