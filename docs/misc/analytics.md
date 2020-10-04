# Analytics

Suite collects anonymous data on how user interacts with the application.

## Catalogue of events

Refer to `AnalyticsEvent` type in [analyticsActions.ts](../../packages/suite/src/actions/suite/analyticsActions.ts)

## Versioning

Whenever there shall be a change in `AnalyticsEvent` type `version` variable in [analyticsActions.ts](../../packages/suite/src/actions/suite/analyticsActions.ts) 
should be bumped. Please follow simple semver versioning in format `<breaking-change>.<analytics-extended>`.
Breaking change should bump major version. Any other change bumps minor version.

## Changelog

### 1.0.
- initial version 

### 1.1.
- device-update-firmware. added: toFwVersion
