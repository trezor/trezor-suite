# Environments

## Staging

Staging is available at staging-suite.trezor.io and is only accessible within SatoshiLabs internal IP range (office + VPN).

Before releasing publicly we deploy to so-called staging environment which should be 1:1 with production. QA tests the release there.

## Production (suite.trezor.io)

Stable version is hosted on suite.trezor.io.

| route            | source                    | assetPrefix                           |
| ---------------- | ------------------------- | ------------------------------------- |
| /                | @trezor/suite-web-landing | -                                     |
| /web             | @trezor/suite-web         | /web                                  |
