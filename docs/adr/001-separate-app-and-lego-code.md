# Separate application composition from reusable building blocks

## Context

Network modules need reusable UI and services from packages such as `@suite/intl` and `@trezor/product-components`.

Importing a useful component from these packages can also pull in application state, routing, or concrete network implementations, creating a risk of tangled code and circular dependencies.

> [!IMPORTANT]
> We need to distinguish code that network modules can import from `@suite/*` from code that assembles those modules into an application.

- [Intl extraction](https://github.com/trezor/trezor-suite/pull/33649): an example of lego extraction.
- [Sign-verify modularization](https://github.com/trezor/trezor-suite/pull/32473): work in progress demonstrating how the split applies to sign-verify.

## Architectural rationale

> [!IMPORTANT]
> **Separation of configuration from use:** components (lego) implement behavior, while app code selects implementations, assembles their dependencies, and wires them into an application.

The wiring belongs in a **Composition Root**, the place near an application's entry point where its dependencies are assembled. This is an application responsibility. In Suite, the web entry point `@suite/web-app` and desktop React entry point `@suite/desktop-app-renderer` already handle parts of this assembly. `@suite/desktop-app` handles Electron packaging and distribution. Registering concrete network modules is another part of that responsibility.

For this proposal, that means the app's business logic is independent of how it is integrated into layouts, menus, and other app-specific structures.

- These components can be composed and tested with explicit dependencies.
- Platform-specific UI also belongs in lego packages when it can be used independently of application assembly.
- The package split makes this dependency direction visible and enforceable with `forbidden-deps`.

### Dependency inversion example

For sign-verify, **dependency inversion** means that the page and the network implementation both depend on an independent API contract. The diagram uses the same final package names as the full example below. Arrows point from a dependency to the code that imports it:

![Sign-verify page and Bitcoin implementation importing the same independent API contract](./001/sign-verify-dependency-inversion.svg)

The composition root registers the concrete network modules and injects the module repository into the application. At runtime, `SignVerifyPage` in `@suite-app/sign-verify-page` obtains the selected module's implementation through that repository. Its dependency on network functionality is expressed through the contract: it has no static import or type dependency on `@trezor/network-bitcoin-suite` or another concrete network implementation.

## Decision

Separate code into folders according to its role in application composition:

- **App code** chooses and wires concrete implementations. It owns application navigation, state integration, and assembly of feature pages. **Network modules cannot import app code.**
- **Lego code** provides reusable building blocks that network modules and app code can both import.

> [!NOTE]
> **Already used in the native app:** `@suite-native/module-*` packages assemble screens and wire application behavior using reusable packages such as `@suite-native/accounts`.

The diagram and layout below use the final package names after migration. For example, reusable code from `@trezor/product-components` is shown as `@suite/product-components`, and the temporary `@suite-lego/sign-verify` becomes `@suite/sign-verify`.

![Sign-verify example showing the app and lego dependency layers](./001/sign-verify-example.svg)

## Practical steps

1. Extract lego code into the temporary `suite-lego` and `suite-native-lego` directories.
2. Once all lego code has moved, rename `suite` to `suite-app` and `suite-native` to `suite-native-app`.
3. Rename `suite-lego` to `suite` and `suite-native-lego` to `suite-native`.

### Final state example

Illustrative layout after the migration, showing a few packages from each layer:

```text
├── networks/
│   ├── network-module/
│   │   ├── suite-common/
│   │   │   └── suite-common-types/     # Shared contracts
│   │   └── suite/
│   │       └── suite-types/            # Desktop/web contracts (purple in the diagram)
│   ├── bitcoin/                        # Implementation (orange in the diagram)
│   │   └── network-bitcoin-suite/      # Contains sign-verify components for Bitcoin
│   └── cardano/                        # Implementation (orange in the diagram)
│       └── network-cardano-suite/      # Contains sign-verify components for Cardano
├── suite/                              # Desktop/web lego (@suite/*)
│   ├── intl/
│   ├── product-components/
│   └── sign-verify/                    # Optional reusable UI for network modules
│                                       # (when two networks share some UI)
├── suite-app/                          # Desktop/web assembly (@suite-app/*)
│   ├── sign-verify-page/               # Page wiring through module contracts
│   ├── networks/                       # Registers concrete network modules
│   ├── web-app/                        # Composition root
│   ├── desktop-app-renderer/           # Desktop React composition root
│   └── desktop-app/                    # Electron packaging and distribution
├── suite-native/                       # Native lego (@suite-native/*)
│   ├── accounts/
│   └── intl/
└── suite-native-app/                   # Native assembly (@suite-native-app/*)
    ├── module-accounts/
    ├── module-sign-verify/
    └── app/                            # Composition root
```

Network modules can import lego packages for their platform. App assembly imports
and registers concrete network modules; reusable packages do not import app assembly.

## Rejected alternatives

No alternatives were considered in detail, as ideas such as tagging packages or keeping the current structure and relying on developers’ knowledge were rejected immediately for obvious reasons.

## Consequences

1. **❗ Large migration.** We need to move and split code across essentially the whole Suite codebase, separating reusable features and business logic from application assembly.
2. **Clear responsibilities.** Application assembly is clearly separated from feature and business code, allowing reusable functionality to evolve independently of how an app composes it.
3. **Simple dependency rules.** The package split makes it clear what can be imported where. `forbidden-deps` can enforce those boundaries through package scopes and directories.
