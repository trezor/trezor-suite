# Jazz Implementation Summary

## Overview

Successfully implemented `@suite-common/suite-sync-jazz` as a replacement for `@suite-common/suite-sync-evolu`. The implementation integrates [Jazz.tools](https://jazz.tools/) for real-time, end-to-end encrypted data synchronization without using React providers.

## Key Design Decisions

### 1. No React Provider Dependency

Instead of using `JazzReactProvider`/`JazzExpoProvider`, we:
- Use `createJazzBrowserContext` from `jazz-tools/browser` to create a LocalNode directly
- Create Jazz instances on-demand when storage is accessed
- Maintain the same interface as Evolu for seamless integration

### 2. Async Label Stores

Label stores (`WalletLabels`, `AccountLabels`, `AddressLabels`, `OutputLabels`) now:
- Accept a factory function that returns `Promise<JazzInstance>`
- Handle Jazz initialization asynchronously
- Fire-and-forget for `update()` operations
- Lazy-subscribe for `subscribe()` operations

### 3. Deterministic Account Creation

- Device owner secret is converted to `Uint8Array` seed
- Jazz derives cryptographic keys deterministically from the seed
- Same device always gets same Jazz account ID
- Credentials stored with unique key per device: `jazz-suite-sync-${ownerId}`

### 4. Local Sync Server Support

- Default development relay: `ws://localhost:4200`
- Default production relay: `wss://cloud.jazz.tools/?key=<api-key>`
- Configuration remains in `suite-common/suite-sync/src/relay/relayUrl.ts`

## Implementation Details

### Core Files

1. **`src/schema.ts`** - Jazz CoMap schemas for labels
   - `WalletLabelSchema`, `AccountLabelSchema`, `AddressLabelSchema`, `OutputLabelSchema`
   - `SuiteSyncRoot` - Container for all label collections (CoLists)
   - `SuiteSyncAccount` - Account schema with migration

2. **Platform-specific Jazz instance factories** (moved out of suite-common)
   - **Browser**: `suite/suite-sync/src/createJazzInstanceBrowser.ts`
     - Uses `createJazzBrowserContext` from `jazz-tools/browser`
     - Uses `LocalStorageKVStore` for auth storage
     - Uses IndexedDB for persistent storage
   - **Native**: `suite-native/suite-sync/src/createJazzInstanceNative.ts`
     - Uses `createJazzReactNativeContext` from `jazz-tools/react-native-core`
     - Uses `ExpoSecureStoreAdapter` for auth storage
     - Uses `ExpoSQLiteAdapter` for persistent storage
     - Uses `RNQuickCrypto` for optimized crypto operations
   - Both derive account deterministically from device owner secret
   - Both ensure root CoValue is loaded before returning

3. **`src/jazzStorage.ts`** - Storage factory
   - Creates label stores with shared Jazz instance
   - Implements `updateRelayUrl` by reconnecting
   - Implements `dispose` to clean up connections

4. **`src/labeling/*.ts`** - Label store implementations
   - Each store implements the `*LabelsStore` interface
   - Async initialization pattern
   - Find-or-create logic for updates
   - Subscription using Jazz's built-in mechanism

5. **`src/jazzCreateSuiteSyncOwner.ts`** - Owner credential creation
   - Converts device state to Suite Sync owner
   - Maintains compatibility with existing interface

### Integration Points

#### Desktop/Web (`suite/suite-sync/src/index.ts`)
```typescript
// Uses browser-specific implementation from './createJazzInstanceBrowser'
export const createSuiteSyncDesktop = (deps: InitSuiteSyncDesktopDeps): SuiteSync => {
    const createJazzInstance = createJazzInstanceFactory(); // Browser version
    const createJazzStorage = createJazzStorageFactory({ createJazzInstance });

    return createSuiteSyncCompositionRoot({
        getState: deps.getState,
        dispatch: deps.dispatch,
        createSuiteStorage: createJazzStorage,
        createSuiteSyncOwner: jazzCreateSuiteSyncOwner,
    });
};
```

#### React Native (`suite-native/suite-sync/src/initSuiteSyncNative.ts`)
```typescript
// Uses native-specific implementation from './createJazzInstanceNative'
export const initSuiteSyncNative = (deps: InitSuiteSyncNativeDeps): SuiteSync => {
    const createJazzInstance = createJazzInstanceFactory(); // Native version
    const createJazzStorage = createJazzStorageFactory({ createJazzInstance });

    return createSuiteSyncCompositionRoot({
        getState: deps.getState,
        dispatch: deps.dispatch,
        createSuiteStorage: createJazzStorage,
        createSuiteSyncOwner: jazzCreateSuiteSyncOwner,
    });
};
```

## Data Flow

```
Device State (ownerSecret)
    ↓
jazzCreateSuiteSyncOwner (converts to SuiteSyncOwner)
    ↓
createJazzInstance (creates LocalNode + Account)
    ↓
createJazzStorage (creates label stores)
    ↓
Label Stores (wallet, account, address, output)
    ↓
Redux (via subscriptions)
```

## Migration from Evolu

### What Changed

1. **Schema format**: SQL tables → Jazz CoMaps/CoLists
2. **Storage mechanism**: SQLite → IndexedDB (web) / SQLite (native) via Jazz
3. **Sync protocol**: HTTP/WebSocket via Evolu → WebSocket via Jazz
4. **Account creation**: Evolu owner → Jazz account (deterministic)

### What Stayed the Same

1. **Public API**: Same `SuiteSyncStorage` interface
2. **Label types**: Same `WalletLabel`, `AccountLabel`, etc.
3. **Integration**: Same `createSuiteSyncCompositionRoot` pattern
4. **Configuration**: Same relay URL configuration

### Breaking Changes

- Removed `JazzContext.tsx` (React Context provider)
- Removed global account management
- Changed from sync to async label store initialization
- Removed React dependency (was peer dependency)

## Running Local Sync Server

For development/testing:

```bash
# Using npx
npx jazz-run sync --port 4200

# Using Docker
docker run -p 4200:4200 jazz-tools/sync-server
```

## Dependencies

- `jazz-tools@^0.19.3` - Jazz framework
- `cojson@^0.19.3` - Jazz's underlying CRDT library
- `@suite-common/suite-sync-storage` - Storage interfaces
- `@suite-common/suite-types` - Type definitions
- `@suite-common/wallet-config` - Network configuration  
- `@suite-common/wallet-types` - Wallet types

## Security

- All data is end-to-end encrypted using Jazz's built-in encryption
- Account credentials derived from device owner secret (never leaves device)
- Sync server cannot read encrypted data
- Each device has its own Jazz account
- Automatic key rotation when users are removed from groups

## Performance Considerations

- Lazy initialization: Jazz instance created only when needed
- Shared instance: All label stores share one Jazz instance per device
- Async operations: Non-blocking updates and subscriptions
- Local-first: Data available offline, syncs when online

## Testing

To test the implementation:

1. Start local Jazz sync server on port 4200
2. Run Suite desktop/web or native app
3. Connect a Trezor device
4. Create/update labels (wallet, account, address, output)
5. Verify labels sync across devices
6. Test offline mode by disconnecting network
7. Verify labels persist after app restart

## Known Limitations

1. No automatic Evolu → Jazz data migration implemented
2. Labels created in Evolu won't automatically appear in Jazz
3. Requires manual data migration if switching from Evolu

## Future Improvements

1. Implement Evolu → Jazz data migration utility
2. Add comprehensive integration tests
3. Add retry logic for failed sync operations
4. Monitor and optimize bundle size
5. Add telemetry for sync performance

## Resources

- [Jazz Documentation](https://jazz.tools/docs)
- [Jazz GitHub](https://github.com/garden-co/jazz)
- [Jazz Discord](https://discord.gg/utDMjHYg42)
- [LLM Instructions](./llms-full.txt) - Full Jazz documentation for AI tools

