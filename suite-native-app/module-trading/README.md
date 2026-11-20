# Module trading

This module provides the core trading experience for users.

It includes the following screens:

- Trading tab in the bottom navigation bar
- Trading settings screen in settings
- Trading onboarding screen for new users
- Trading onboarding screen for existing users

## Modules

### @suite-native-app/module-trading

Main module providing buy, sell, and exchange flows.

### @suite-native/trading-history

Provides the trade history screen and all history-related components (trade list, trade detail sheet).

### @suite-native/trading-quote-utils

Shared trading utilities used by both `module-trading` and `trading-history` components.

### @suite-native/trading-provider-utils

Shared provider-aware UI components (`Footer`, `HowTradingWorksSheet`, `KycPolicyWarning`) used by both `module-trading` and `trading-history`.

### @suite-native/trading-shared

Public interface of trading for external modules. Re-exports only the parts of `trading-state` and `trading-types` that are needed outside of trading (the trading slice, middlewares, migrations and selectors used by app assembly, settings, onboarding, home, banners and earn).

### @suite-native/trading-state

Provides state management for trading features.

### @suite-native/trading-residence

Provides residence selection. Residence selection should be displayed on iOS only.

This module provides onboarding screens and settings screen for residence selection.

### @suite-native/transaction-management

Provides logic shared between trading and send flow.

### Internal trading modules

- **@suite-native/trading-analytics:** Analytics helpers.
- **@suite-native/trading-atoms:** Reusable components.
- **@suite-native/trading-browser-auth:** Hooks and components for handling browser authentication in trading features.
- **@suite-native/trading-debug:** Debug UI components for displaying information while `IsTradingDebugEnabled` FF is set.
- **@suite-native/trading-slippage:** Slippage picker, bottom sheet, summary, and form hook for DEX exchange trades.
- **@suite-native/trading-types:** Types used across trading modules.
- **@suite-native/trading-consts:** Constants used across trading modules.
- **@suite-native/trading-fixtures:** Fixtures for testing trading features.

## Dependency rules

The rules are enforced by `forbiddenDeps.config.ts` files and checked by `yarn requirements:verify`.

- `@suite-native/trading-*` packages may be used only by other `@suite-native/trading-*` packages and `@suite-native-app/module-trading`. Each package lists its additional allowed consumers in `allowedConsumers`.
- External modules access trading state through `@suite-native/trading-shared`. Trading packages and `module-trading` must not import it and use the building blocks directly.
- `@suite-native/trading-residence` (residence screens) and `@suite-native/trading-consts` (used by app assembly) still allow the existing external consumers listed in their configs.

Dashed arrows are dev dependencies or type-only imports.

### Trading packages

<!-- prettier-ignore-start -->

```mermaid
graph TD
    module-trading["@suite-native-app/module-trading"]
    trading-shared["@suite-native/trading-shared"]
    subgraph shared["Shared modules"]
        transaction-management["@suite-native/transaction-management"]
    end
    subgraph trading-internal["Trading packages"]
        trading-analytics["@suite-native/trading-analytics"]
        trading-atoms["@suite-native/trading-atoms"]
        trading-browser-auth["@suite-native/trading-browser-auth"]
        trading-consts["@suite-native/trading-consts"]
        trading-debug["@suite-native/trading-debug"]
        trading-fixtures["@suite-native/trading-fixtures"]
        trading-history["@suite-native/trading-history"]
        trading-provider-utils["@suite-native/trading-provider-utils"]
        trading-quote-utils["@suite-native/trading-quote-utils"]
        trading-residence["@suite-native/trading-residence"]
        trading-slippage["@suite-native/trading-slippage"]
        trading-state["@suite-native/trading-state"]
        trading-types["@suite-native/trading-types"]
    end

    trading-shared -.-> trading-types
    trading-shared --> trading-state
    trading-consts -.-> trading-types
    trading-fixtures --> trading-consts
    trading-fixtures -.-> trading-types
    trading-atoms -.-> trading-fixtures
    trading-atoms -.-> trading-types
    module-trading --> transaction-management
    module-trading --> trading-analytics
    module-trading --> trading-atoms
    module-trading --> trading-browser-auth
    module-trading --> trading-consts
    module-trading --> trading-debug
    module-trading -.-> trading-fixtures
    module-trading --> trading-history
    module-trading --> trading-provider-utils
    module-trading --> trading-quote-utils
    module-trading --> trading-residence
    module-trading --> trading-slippage
    module-trading --> trading-state
    module-trading -.-> trading-types
    trading-analytics -.-> trading-fixtures
    trading-analytics --> trading-atoms
    trading-browser-auth -.-> transaction-management
    trading-browser-auth --> trading-analytics
    trading-browser-auth --> trading-atoms
    trading-browser-auth -.-> trading-fixtures
    trading-browser-auth --> trading-state
    trading-browser-auth -.-> trading-types
    trading-browser-auth --> trading-debug
    trading-debug -.-> trading-consts
    trading-debug -.-> trading-types
    trading-debug --> trading-state
    trading-state --> trading-atoms
    trading-state --> trading-consts
    trading-state -.-> trading-fixtures
    trading-state -.-> trading-types
    trading-history --> trading-atoms
    trading-history -.-> trading-fixtures
    trading-history --> trading-state
    trading-history --> trading-provider-utils
    trading-history --> trading-quote-utils
    trading-provider-utils --> trading-state
    trading-provider-utils -.-> trading-fixtures
    trading-provider-utils -.-> trading-types
    trading-quote-utils -.-> trading-fixtures
    trading-residence --> trading-state
    trading-residence --> trading-atoms
    trading-residence -.-> trading-types
    trading-slippage --> trading-state
    trading-slippage --> trading-atoms
    trading-slippage -.-> trading-fixtures

    classDef trading-root fill: #c61, stroke: #333, stroke-width: 2px
    classDef trading-group fill: #555, stroke: #333, color: #ddd
    class module-trading,trading-shared trading-root
    class trading-internal,shared trading-group
```

<!-- prettier-ignore-end -->

### Trading entry points and their consumers

<!-- prettier-ignore-start -->

```mermaid
graph TD
    subgraph consumers["Consumers"]
        app["@suite-native-app/app"]
        banners["@suite-native/banners"]
        module-dev-utils["@suite-native-app/module-dev-utils"]
        module-earn["@suite-native/module-earn"]
        module-home["@suite-native-app/module-home"]
        module-onboarding["@suite-native-app/module-onboarding"]
        module-send["@suite-native-app/module-send"]
        module-settings["@suite-native-app/module-settings"]
        module-stellar-token-management["@suite-native-app/module-stellar-token-management"]
        module-transactions["@suite-native-app/module-transactions"]
        send["@suite-native/send"]
        state["@suite-native-app/state"]
        trading-browser-auth["@suite-native/trading-browser-auth"]
        transaction-review["@suite-native/transaction-review"]
    end
    module-trading["@suite-native-app/module-trading"]
    subgraph entry-points["Trading entry points"]
        trading-shared["@suite-native/trading-shared"]
        trading-residence["@suite-native/trading-residence"]
    end
    subgraph shared["Shared modules"]
        transaction-management["@suite-native/transaction-management"]
    end

    banners --> trading-shared
    module-dev-utils --> trading-shared
    module-home --> trading-shared
    module-onboarding --> trading-residence
    module-onboarding --> trading-shared
    module-settings --> trading-residence
    module-settings --> trading-shared
    module-earn --> trading-shared
    module-earn --> transaction-management
    app --> module-trading
    app --> trading-residence
    app --> trading-shared
    module-trading --> trading-residence
    module-trading --> transaction-management
    module-send --> transaction-management
    state --> trading-shared
    state --> transaction-management
    module-stellar-token-management --> transaction-management
    module-transactions --> transaction-management
    send --> transaction-management
    trading-browser-auth -.-> transaction-management
    transaction-review --> transaction-management

    classDef outer fill: #6c757d, color: #fff, stroke: #495057
    classDef trading-root fill: #c61, stroke: #333, stroke-width: 2px
    classDef trading-group fill: #555, stroke: #333, color: #ddd
    class app,banners,module-dev-utils,module-earn,module-home,module-onboarding,module-send,module-settings,module-stellar-token-management,module-transactions,send,state,trading-browser-auth,transaction-review outer
    class module-trading trading-root
    class entry-points,shared trading-group
```

<!-- prettier-ignore-end -->
