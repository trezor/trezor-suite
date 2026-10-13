### Message System Core

Platform-agnostic core of the message system: config acquisition, JWS verification, sequence checks,
polling and condition evaluation. It contains no React, no Redux and no `window` access, so it can
also run in the Electron main process, which additionally narrows a config to the conditions it can
decide without a renderer fact (`toFactIndependentConfig`).

[`@suite-common/message-system`](../message-system/README.md) is the Redux and React layer built on
top of it. More info in [Documentation](../../docs/features/message-system.md).
