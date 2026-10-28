## Suite Sync Storage (Types)

For what a storage means in Suite Sync, see [Storage](../../docs/features/suite-sync.md#storage) in the Suite Sync documentation.

This package is the abstraction for storage. Suite Sync can in theory
work with different library then Evolu. This is the abstraction that enables it.

The `@suite-common/suite-sync` and `@suite-common/suite-sync-types` packages
works against this abstraction.

This package MUST NOT depend on `@evolu/common`. neither on the `@suite-common/suite-sync`

### Data

This package also defines data structure of all data that are stored in the Suite Sync.
Those definitions are stored in the `data` directory in form of tables.
