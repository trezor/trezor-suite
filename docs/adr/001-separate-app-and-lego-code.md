# Networks provide capabilities, applications compose and render them

## Context

Network modularization moves network-specific behavior out of shared code. A new network should be added by registering it, not by editing every feature that branches on the network type. The goals are isolation, loading only what is used, a smaller security surface and simpler development.

[#32473](https://github.com/trezor/trezor-suite/pull/32473) applied the first version of this ADR to sign & verify. Each network got a Suite module that renders its own form, and lego packages hold the shared pieces. That implementation showed where the boundary leaks:

- **Network packages became app code.** `@trezor/network-bitcoin-suite` depends on React, react-redux, redux, react-hook-form, yup, `@suite-lego/intl`, `@suite-lego/sign-verify` and four `@suite-common/*` packages. Its thunks read the store shape and dispatch toasts.
- **The boundary was widened to fit.** The networks rule that forbade `@suite-common/*` was removed.
- **The contract was not independent.** `@trezor/network-module-suite-types` depends on React and on wallet types, because a module exposes a component.
- **UI travelled through the services bag.** The app put a React component, `signVerifyAddress`, into the services so lego could render it.
- **Duplication followed.** One form with a single Cardano branch became three near-identical forms, which would repeat for every feature.

The review of the first version asked to split the dependency rule from the folder layout, for real alternatives, and what happens if the proposal is rejected.

Two more constraints shape the decision. A network is not fixed per symbol. An EVM chain can be served by Blockbook or a custom RPC, and a Solana network can run a version that changes what is possible. Network state, meaning backends and Connect calls, should also stay separate from application state.

## Decision

### Dependency rule

1. **Network packages depend on reusable `@trezor/*` libraries only.** They do not import React, Redux, i18n catalogs or any `@suite/*`, `@suite-common/*`, `@suite-native/*` or `@suite-cli/*` package. `networks/forbiddenDeps.config.ts` enforces this.
2. **Only composition roots name concrete networks.** The desktop, web and native roots register network families and inject what families need, such as Connect. Nothing else imports a concrete family.
3. **App integration owns application state.** Shared thunks in `@suite-common/*` read the selected device and preferences, report analytics, show toasts, and call network capabilities.
4. **Platform UI owns React and translations.** It renders what a capability describes and never branches on the network type.
5. **Each layer receives dependencies through one channel.** Factories take `deps` from the composition root. Thunks read `extra.services`. Components use `useGetter` or `useServices`, plus props.

### Mechanism: network families, context and capabilities

- **A family is a pure TypeScript module**, such as `bitcoinFamily` in `@trezor/network-bitcoin-suite-common`. It turns a network's static config and a runtime context into a network object. The context holds the backend, the account type and the version.
- **A capability is a typed, optional facet of the network**, such as `messageSigning`. It exists only when its declared requirements hold for the context: a feature for the account type, a backend, or a minimum version. Its presence is the support check. There are no parallel boolean flags.
- **Families implement capabilities on their own closed types.** Bitcoin signs with its own account data and offers only `default` or `electrum`. Cardano alone knows its stake address. A boundary, such as `defineMessageSigning`, narrows the app's account and every value passed back on each call. A format the UI hands back must be one the family offered.
- **Labels are data.** A capability carries `{ id, defaultMessage }` labels. Each platform renders them through its own catalog, and a test keeps family labels in step with the desktop catalog.
- **A resolver hands networks to the app.** `getNetwork({ symbol, accountType })` in `@suite-common/networks` resolves through the family serving the symbol, for the backend serving it now. The same context returns the same object, and a backend change resolves a new one.
- **Pages render from capabilities.** The sign & verify page reads its tabs, format switch, address groups and outputs from `messageSigning`, then signs through the shared thunk.

The reference implementation is [#33975](https://github.com/trezor/trezor-suite/pull/33975), stacked on [#32473](https://github.com/trezor/trezor-suite/pull/32473). It applies this to sign & verify on desktop, web and native.

### Diagrams

`A --> B` means A imports B. Dashed edges are runtime wiring by a composition root. `--x` is an import the networks boundary rejects.

Before, as implemented in #32473:

```mermaid
flowchart TB
    subgraph APP["App · @suite/* + packages/suite"]
        SUITE["@trezor/suite<br/>composition root"]
        PAGE["@suite/module-sign-verify<br/>SignVerifyPage"]
        SNET["@suite/networks<br/>Suite module registry"]
    end

    subgraph LEGO["Lego · @suite-lego/*"]
        LSV["@suite-lego/sign-verify<br/>fields · form hook · toasts · analytics · device lookup"]
        LINTL["@suite-lego/intl"]
    end

    subgraph NETS["Networks · @trezor/network-*"]
        CTR["@trezor/network-module-suite-types<br/>SignVerifyModule = { Component, canVerify }"]
        BTCS["@trezor/network-bitcoin-suite<br/>BitcoinSignVerify.tsx + thunks"]
        ETHS["@trezor/network-ethereum-suite<br/>EthereumSignVerify.tsx + thunks"]
        ADAS["@trezor/network-cardano-suite<br/>CardanoSignVerify.tsx + thunks"]
    end

    subgraph COMMON["Shared · @suite-common/*"]
        SCOM["analytics · receive · wallet-config · wallet-types<br/>device · wallet-core · toast-notifications"]
    end

    subgraph EXT["External"]
        REACT[react]
        RRD[react-redux]
        REDUX[redux]
        RHF["react-hook-form · yup"]
        RINTL[react-intl]
    end

    SUITE --> PAGE & SNET
    SUITE -. "services bag: signVerifyAddress = &lt;Address/&gt;<br/>suiteNetworkModuleRepository" .-> LSV
    PAGE --> CTR
    SNET --> BTCS & ETHS & ADAS & CTR
    CTR --> REACT
    CTR --> SCOM
    BTCS & ETHS & ADAS --> CTR
    BTCS & ETHS & ADAS --> LSV
    BTCS & ETHS & ADAS --> LINTL
    BTCS & ETHS & ADAS --> SCOM
    BTCS & ETHS & ADAS --> REACT & RRD & REDUX & RHF
    LSV --> SCOM & LINTL & REACT & REDUX & RHF
    LINTL --> RINTL

    classDef bad fill:#fde8e8,stroke:#c0392b,color:#222
    class CTR,BTCS,ETHS,ADAS bad
```

After, boundaries and imports:

```mermaid
flowchart TB
    subgraph ROOTS["Composition roots"]
        SUITE["@trezor/suite<br/>web-app · desktop-app-renderer"]
        NAPP["@suite-native/app · state"]
    end

    subgraph UI["Platform UI · React"]
        SV["@suite/sign-verify<br/>one SignVerifyForm"]
        NSV["@suite-native/module-sign-verify"]
    end

    subgraph INTEG["App integration · @suite-common · Redux"]
        SCSV["@suite-common/sign-verify<br/>sign · verify · showAddress thunks"]
        WCORE["@suite-common/wallet-core<br/>selectNetworkBackendType"]
        SCN["@suite-common/networks<br/>getNetwork resolver · family registry"]
    end

    subgraph NET["Network layer · pure TypeScript · @trezor/* only"]
        CTR["@trezor/network-module-suite-common-types<br/>defineFamily · defineCapability · MessageSigning · Label"]
        FAM["bitcoin · ethereum · cardano families<br/>messageSigning + labels"]
        REST["ripple · solana · stellar · tron families"]
        RULE>"no react · redux · react-intl · @suite-* imports"]
    end

    subgraph LIBS["Reusable @trezor/* libraries"]
        CC["@trezor/connect-common"]
        DI["@trezor/dependency-injection"]
        COMP["@trezor/components"]
    end

    subgraph I18N["i18n catalogs"]
        DINTL["@suite-lego/intl"]
        NINTL["@suite-native/intl"]
    end

    subgraph EXT["External libraries"]
        REACT["react · react-redux"]
        RTK["redux · @reduxjs/toolkit"]
        FORMS["react-hook-form · yup"]
        RINTL["react-intl"]
        RN["react-native · @react-navigation"]
        CRY["@noble/hashes · @scure/base · viem · cbor · @trezor/protobuf"]
    end

    SUITE --> SV & SCN & WCORE
    NAPP --> NSV & SCN & WCORE
    SV --> SCSV & SCN & CTR & DINTL & COMP & DI
    NSV --> SCSV & SCN & CTR & NINTL & DI
    SCSV --> SCN & WCORE & CTR
    WCORE --> SCN
    SCN --> FAM & REST & CTR & DI
    FAM & REST --> CTR
    FAM --> CC & CRY
    CTR --> CC

    UI --> REACT & FORMS
    NSV --> RN
    INTEG --> RTK
    DI & COMP --> REACT
    DINTL & NINTL --> RINTL

    NET --x|forbidden-deps| INTEG
    NET --x|forbidden-deps| UI

    classDef pure fill:#e8f5e9,stroke:#2e7d32,color:#222
    classDef ui fill:#e3f2fd,stroke:#1565c0,color:#222
    classDef ext fill:#f5f5f5,stroke:#9e9e9e,color:#222,stroke-dasharray: 3 3
    class CTR,FAM,REST,RULE pure
    class SV,NSV ui
    class REACT,RTK,FORMS,RINTL,RN,CRY ext
```

After, runtime wiring:

```mermaid
flowchart LR
    subgraph ROOT["Composition root (desktop/web and native)"]
        CR["createSuiteServicesCompositionRoot<br/>createNativeServicesCompositionRoot"]
    end

    CONNECT(["TrezorConnect"])
    STATE(["Redux state<br/>wallet.blockchain backends"])

    CR -- "getTrezorConnect" --> NCR["createNetworksCompositionRoot"]
    CR -- "getNetworkBackend =<br/>toGetter(selectNetworkBackendType)" --> NCR
    NCR -- "family.bind({ getTrezorConnect })" --> FAMS["bitcoin · ethereum · cardano · … families"]
    NCR --> RES["getNetwork<br/>memoized per symbol · accountType · backend · version"]
    FAMS --> RES
    STATE -. read by getter .-> RES
    FAMS -. "deps.getTrezorConnect()" .-> CONNECT

    RES -- "useGetter(injectGetNetwork)" --> PAGE["Desktop page · native screen"]
    RES -- "extra.services.networks.getNetwork" --> THUNK["shared sign / verify thunks"]
    PAGE -- dispatch --> THUNK
```

How a page discovers and calls a capability:

```mermaid
sequenceDiagram
    autonumber
    participant Page as SignVerifyPage / Form (React)
    participant Resolver as getNetwork (@suite-common/networks)
    participant State as Redux state (wallet.blockchain)
    participant Family as bitcoinFamily (pure TS)
    participant Cap as messageSigning (bound to context)
    participant Thunk as signThunk (@suite-common/sign-verify)
    participant Connect as TrezorConnect

    Page->>Resolver: useGetter(injectGetNetwork, { symbol, accountType })
    Resolver->>State: getNetworkBackend(symbol)
    State-->>Resolver: 'blockbook' | 'electrum' | 'evm-rpc' …
    Resolver->>Family: createNetwork(deps, context) (memoized per context key)
    Family-->>Resolver: Network { config, capabilities: { messageSigning? } }
    Resolver-->>Page: OpenNetwork (same object while context is unchanged)
    Page->>Cap: getFormatChoice(account) · getSignAddressGroups(…) · labels · verify?
    Note over Page,Cap: UI renders tabs, format switch, address groups and outputs from data only
    Page->>Thunk: dispatch(signThunk({ account, path, message, isHex, format }))
    Thunk->>Resolver: extra.services.networks.getNetwork(…)
    Thunk->>State: selected device · address display type
    Thunk->>Cap: sign({ device, account, path, message, isHex, format, isChunkified })
    Cap->>Cap: toAccount(account) · validate the format against what it offered
    Cap->>Connect: deps.getTrezorConnect().signMessage(…)
    Connect-->>Cap: Result
    Cap-->>Thunk: Result<SignedMessage, MessageSigningError>
    Thunk-->>Page: toast + analytics, then the signature or false
```

### Not decided here

- **Folder and scope renames**, such as `suite-app`, `suite-lego` or `module-*`. With network packages free of UI, the main reason for a lego tier inside `@suite/*` is gone. Any rename that still helps can be its own ADR.
- **Lazy loading of families.** The resolver is the natural place for it; this ADR only keeps that option open.
- **Moving other consumers of `SuiteCommonNetworkModule`** onto families. That happens feature by feature.

### Migration

- **Opportunistic, per feature.** When work touches a feature that branches on the network type, add a capability contract, implement it in the families, and render from it.
- **Parity tests guard each move.** Keep one per migrated feature, until the old feature flag is removed, so the capability cannot drift from it.
- **The existing module repository stays** for config, icons and validation until its consumers move.

## Rejected alternatives

- **Per-network UI modules, as in #32473.** They require network packages to import UI, state and app layers. The boundary has to be widened, the contract depends on React, and every feature is written once per network.
- **A lego tier and a folder rename, as in the first version of this ADR.** This fixes import direction for shared UI pieces, but leaves network packages rendering and reading state. The rename touches the whole codebase and changes what `@suite/*` means twice during the migration.
- **A static per-symbol network registry.** One object per symbol cannot express behavior that depends on the backend, the account type or the version.
- **Enforcing the rule now and renaming later**, Matěj Kříž's option B. This ADR adopts the enforcement half. The rename is left to a later decision.
- **An enforced `module-*` prefix for app feature packages**, Matěj Kříž's option C. This is orthogonal: a naming rule for app packages, compatible with this ADR.
- **Events or streams between networks and the app.** They add indirection and lose typing at the boundary. Direct calls that return `Result` cover the cases so far.

## Consequences

- **Easier:**
    - Adding a network means a new family and one registration line, with no UI change unless the network introduces new vocabulary.
    - Network behavior is tested without React or a store.
    - The boundary is checked by `requirements:verify`.
    - Desktop and native share the same thunks and capabilities, and each feature has one form per platform.
- **Harder:**
    - Each feature needs a capability contract designed up front: its closed and open types, and its labels.
    - Family labels must stay in the platform catalogs, which a test enforces.
    - Developers have to learn `defineFamily` and `defineCapability`.
    - `@suite-common/networks` still hosts the legacy networks Redux slice next to the resolver until it is split out.
- **Ruled out:** network packages that render React, read Redux, or import `@suite-*`.
- **If this is rejected:** the #32473 direction stands. Network packages depend on app layers, the boundary has to be relaxed per feature, and cycles stay possible between shared app code and network packages.
- **Revisit when:**
    - a feature needs network-specific UI that data cannot describe; then consider a UI slot that the app owns and the network fills with data, or
    - lazy loading of families is designed.
