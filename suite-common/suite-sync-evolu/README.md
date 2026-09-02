## Suite Sync Evolu

This package provides the Evolu-backed transport layer for Suite Sync. It connects
the shared storage contract from `@suite-common/suite-sync-storage` to Evolu and
contains the Evolu-specific setup, schema, data mapping, relay connection, and
lifecycle management.

Keeping the integration in one package gives Suite Sync a clear, modular boundary.
The rest of Suite Sync can work with shared abstractions instead of depending on
Evolu-specific APIs. Evolu is the current implementation, but another sync solution
could be introduced by implementing the same storage contract without requiring
changes throughout Suite Sync.

To preserve this boundary, Evolu-specific code and direct dependencies on
`@evolu/common` belong in this package. This keeps the integration cohesive and
makes it easier to maintain or replace independently.

### Data

The `src/data` directory contains the adapters that map the abstract Suite Sync
table types from `@suite-common/suite-sync-storage` to Evolu schemas and types.

Each table supports updates and subscriptions, enabling bidirectional data flow
between Suite Sync and Evolu.
