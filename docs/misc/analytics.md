# Analytics

Suite collects anonymous data on how user interacts with the application. This feature is by default "on". User has to opt-out either on analytics screen that follows 
after welcome screen (if starting Suite for the first time) or by unchecking switch in settings.

Data is transferred in GET requests encoded in uri.

## Catalogue of events

Refer to `AnalyticsEvent` type in [analyticsActions.ts](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/analyticsActions.ts)

## Anonymity

Suite should never collect:

- device id
- any fingerprinting

## Data endpoints

List of available configured endpoints:

    https://data.trezor.io/suite/log    /desktop   /staging     .log
    https://data.trezor.io/suite/log    /desktop   /beta        .log
    https://data.trezor.io/suite/log    /desktop   /develop     .log
    https://data.trezor.io/suite/log    /desktop   /stable      .log
    https://data.trezor.io/suite/log    /web       /staging     .log
    https://data.trezor.io/suite/log    /web       /beta        .log
    https://data.trezor.io/suite/log    /web       /develop     .log
    https://data.trezor.io/suite/log    /web       /stable      .log

Currently used endpoints:

| env                          | Are                                                 |
| ---------------------------- |--------------------------------------------------   |
| staging-suite.trezor.io      | https://data.trezor.io/suite/log/web/staging.log    |
| beta-wallet.trezor.io        | https://data.trezor.io/suite/log/web/beta.log       |
| suite.trezor.io              | https://data.trezor.io/suite/log/web/stable.log     |
| any origin                   | https://data.trezor.io/suite/log/web/develop.log    |
| desktop                      | https://data.trezor.io/suite/log/desktop/beta.log   |

## Versioning

Whenever there shall be a change in `AnalyticsEvent` type `version` variable in [analyticsActions.ts](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/analyticsActions.ts) 
should be bumped. Please follow simple semver versioning in format `<breaking-change>.<analytics-extended>`.
Breaking change should bump major version. Any other change bumps minor version.

## Changelog

### 1.0.
- initial version 

### 1.1.
Added:
- device-update-firmware:
  - toFwVersion
- suite-ready
  - platformLanguage
  - platform
- device-connect:
  - totalInstances
