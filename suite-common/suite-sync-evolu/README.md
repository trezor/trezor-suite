## Suite Sync Evolu

This package is the concrete storage implementation for Evolu library.
This is the ONLY package that shall depend on the `@evolu/common`.
Do not import Evolu anywhere else.

### Data

In the `data` directory there is an implementation (and type-mapping)
of abstract Suite Sync types from `suite-sync-storage` onto Evolu types.

Every table has `update` and `subcribe` method for bidirectional data flow.
