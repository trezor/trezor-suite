# Sentry

Trezor Suite uses [Sentry.io](https://sentry.io/) to track errors and monitor app performance on the machines of users who have enabled anonymous data collection. This allows us to optimize Trezor Suite and fix compatibility issues across many different usage environments.

No data is shared with Sentry if users have disabled usage data tracking [^1].

[^1]: In rare cases an error may occur before Suite loads the user's decision from its internal storage. Such an error is still reported, but only in a minimal form without breadcrumbs, context and request data.

Confidential data (e.g. device ids and labels, addresses, xpubs, transaction ids and amounts) is redacted before an event leaves the app. The redaction lives in the code, which is the source of truth: see [`suite/sentry`](https://github.com/trezor/trezor-suite/blob/develop/suite/sentry/src/config.ts) and [`suite-common/sentry`](https://github.com/trezor/trezor-suite/blob/develop/suite-common/sentry/src/index.ts).

## What is being tracked

### General data

Browser (User Agent), System and HW specifications, Suite version, instance id shared with analytics.

### Breadcrumbs

**Timestamps**, clicks, navigation and network requests made by Suite, with confidential parts of URLs redacted.

### Extra data

Error reports may include a redacted snapshot of the Suite state:

- Enabled coins, e.g. `[btc, ltc, eth]`.
- Wallet discovery progress, e.g. which networks were loaded or failed.
- Device information, e.g. model, firmware version and enabled features.
- A redacted log of the most recent application actions.
