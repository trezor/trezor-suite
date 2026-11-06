# @suite-app/suite-sync

Desktop and web Suite Sync composition. This package selects the Evolu web storage implementation,
relay status integration, error handling and desktop analytics decorator.

The web and desktop entry points inject `createSuiteSyncDesktopCompositionRoot` into the shared
Suite services assembly through the `SuiteSyncDesktopFactory` contract from `@suite/suite-sync`.
Reusable UI, selectors and error handling remain in `@suite/suite-sync`; shared domain logic remains
in `@suite-common/suite-sync`.
