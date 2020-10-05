# Analytics

Suite collects anonymous data on how user interacts with the application. This feature is by default "on". User has to opt-out either on analytics screen that follows 
after welcome screen (if starting Suite for the first time) or by unchecking switch in settings.

## Catalogue of events

Refer to `AnalyticsEvent` type in [analyticsActions.ts](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/analyticsActions.ts)

## Anonymity

Suite should never collect:

- device id
- user agent or do any fingerprinting

## Data endpoints

Data is transferred in GET requests encoded in uri. Endpoints are:

| env                          | Are                                                 |
| ---------------------------- |--------------------------------------------------   |
| staging-wallet.trezor.io     | https://data.trezor.io/suite/log/web/staging.log    |
| beta-wallet.trezor.io        | https://data.trezor.io/suite/log/web/beta.log       |
| wallet.trezor.io             | https://data.trezor.io/suite/log/web/stable.log     |
| desktop                      | https://data.trezor.io/suite/log/desktop/beta.log   |

## Versioning

Whenever there shall be a change in `AnalyticsEvent` type `version` variable in [analyticsActions.ts](https://github.com/trezor/trezor-suite/blob/develop/packages/suite/src/actions/suite/analyticsActions.ts) 
should be bumped. Please follow simple semver versioning in format `<breaking-change>.<analytics-extended>`.
Breaking change should bump major version. Any other change bumps minor version.

## Changelog

### 1.0.
- initial version 

### 1.1.
- device-update-firmware. added: toFwVersion
