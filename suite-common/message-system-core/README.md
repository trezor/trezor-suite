### Message System Core

Platform-agnostic core of the message system: config acquisition, JWS verification, sequence checks
and condition evaluation. It contains no React, no Redux and no `window` access, so it can also run
in the Electron main process.

[`@suite-common/message-system`](../message-system/README.md) is the Redux and React layer built on
top of it. More info in [Documentation](../../docs/features/message-system.md).
