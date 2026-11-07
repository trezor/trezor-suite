# @suite-app/suite-sync

Desktop and web Suite Sync composition. This package selects the Evolu web storage implementation,
relay status integration, error handling and desktop analytics decorator.

The shared Suite services assembly in `@suite-app/app` calls `createSuiteSyncDesktopCompositionRoot`.
Reusable UI, selectors and error handling remain in `@suite/suite-sync`; shared domain logic remains
in `@suite-common/suite-sync`.
