# Web

## Production environments

### Beta (beta-wallet.trezor.io)

Domain beta-wallet.trezor.io originally hosted beta build of [mytrezor wallet](https://github.com/satoshilabs/mytrezor).
With initial release of Trezor Suite this domain was decided to become entry point of closed beta program for Trezor Suite.

It has special structure:


| route            | basic auth  | source                | assetPrefix                               |
| ---------------- | ----------- | --------------------- | ----------------------------------------- |
| /                | NO          | @trezor/landing-page  | -                                         |
| /wallet/start    | YES         | @trezor/landing-page  | -                                         |
| /wallet/web      | YES         | @trezor/suite-web     | /wallet/web                               |


### Stable (suite.trezor.io)

Stable version (currently in public beta) is hosted on suite.trezor.io and should go live on 14th October 2020 via soft launch.
Check [fancy diagram](https://miro.com/app/board/o9J_kwng2E0=/) how it's going to work in it's entirety.


| route            | basic auth  | source                    | assetPrefix                           |
| ---------------- | ----------- | ------------------------- | ------------------------------------- |
| /                | NO          | @trezor/suite-web-landing | -                                     |
| /web             | NO          | @trezor/suite-web         | /web                                  |


## Staging environments

Each of the above mentioned environments have its own staging environment counterpart.

Staging environments are only accessible within SatoshiLabs internal IP range (office + VPN).

| production                | staging counterpart             |
| ------------------------- | ------------------------------- |
| beta-wallet.trezor.io     | staging-wallet.trezor.io        |
| suite.trezor.io           | staging-suite.trezor.io         |
