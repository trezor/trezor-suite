# Platform-Specific Jazz Architecture

## Overview

The Jazz sync implementation is split between platform-agnostic code in `suite-common` and platform-specific implementations in `suite` (desktop/web) and `suite-native` (React Native/Expo).

## Why Platform-Specific?

Jazz requires different APIs for different platforms:

### Browser/Desktop APIs (Not Available in React Native)

- `localStorage` API (for KV storage)
- `IndexedDB` API (for persistent storage)
- Browser-specific WebSocket implementations
- Browser-specific crypto implementations

### React Native/Expo APIs (Not Available in Browser)

- `expo-secure-store` (for secure KV storage)
- `expo-sqlite` (for persistent storage)
- React Native WebSocket implementations
- React Native-optimized crypto (`RNQuickCrypto`)

## Architecture

```
suite-common/suite-sync-jazz/          (Platform-agnostic)
├── src/
│   ├── schema.ts                      ✓ Shared across platforms
│   ├── jazzStorage.ts                 ✓ Shared across platforms
│   ├── jazzCreateSuiteSyncOwner.ts    ✓ Shared across platforms
│   └── labeling/                      ✓ Shared across platforms
│
suite/suite-sync/src/                  (Browser/Desktop specific)
├── createJazzInstanceBrowser.ts       🌐 Browser implementation
└── index.ts                           🌐 Uses browser version
│
suite-native/suite-sync/src/           (React Native/Expo specific)
├── createJazzInstanceNative.ts        📱 Native implementation
└── initSuiteSyncNative.ts             📱 Uses native version
```

## Implementation Details

### Browser/Desktop (`createJazzInstanceBrowser.ts`)

```typescript
import { LocalStorageKVStore, createJazzBrowserContext } from 'jazz-tools/browser';

// Uses browser-specific APIs
const kvStore = new LocalStorageKVStore(); // localStorage-based
const context = await createJazzBrowserContext({
    storage: 'indexedDB', // IndexedDB-based
    // ...
});
```

**Key Features:**

- ✓ `LocalStorageKVStore` for auth credential storage
- ✓ `createJazzBrowserContext` for browser-optimized LocalNode
- ✓ `indexedDB` for persistent CoJSON storage
- ✓ Browser WebSocket with online/offline detection
- ✓ WasmCrypto for optimized browser crypto

### React Native/Expo (`createJazzInstanceNative.ts`)

```typescript
import { ExpoSecureStoreAdapter, ExpoSQLiteAdapter } from 'jazz-tools/expo';
import { ReactNativeContextManager } from 'jazz-tools/react-native-core';
import { RNQuickCrypto } from 'jazz-tools/react-native-core/crypto';

// Uses React Native-specific APIs
const kvStore = new ExpoSecureStoreAdapter(); // expo-secure-store
const sqliteAdapter = new ExpoSQLiteAdapter('...'); // expo-sqlite
await sqliteAdapter.initialize();

const contextManager = new ReactNativeContextManager({
    authSecretStorageKey: storageKey,
});

const context = await contextManager.getNewContext({
    AccountSchema: SuiteSyncAccount,
    guestMode: false,
    sync: { peer: validSyncUrl, when: 'always' },
    storage: sqliteAdapter, // SQLite-based
    CryptoProvider: RNQuickCrypto, // RN-optimized crypto
});
```

**Key Features:**

- ✓ `ExpoSecureStoreAdapter` for secure auth credential storage
- ✓ `ReactNativeContextManager` for managing RN-optimized LocalNode
- ✓ `ExpoSQLiteAdapter` for persistent CoJSON storage via SQLite
- ✓ React Native WebSocket with NetInfo integration
- ✓ `RNQuickCrypto` for optimized mobile crypto

## Shared Interface

Both implementations export the same interface:

```typescript
export type JazzInstance = {
    account: SuiteSyncAccount;
    node: LocalNode;
    done: () => void;
    addConnectionListener: (listener: (connected: boolean) => void) => () => void;
};

export type CreateJazzInstance = (params: {
    suiteSyncOwner: SuiteSyncOwner;
    syncUrl: string;
}) => Promise<JazzInstance>;

export const createJazzInstanceFactory = (): CreateJazzInstance => {
    /* ... */
};
```

This allows `suite-common` code to work with either implementation without knowing platform details.

## Data Flow

### Desktop/Web Flow

```
suite/suite-sync/src/index.ts
    ↓ imports
createJazzInstanceBrowser.ts
    ↓ uses
jazz-tools/browser
    ↓ uses
localStorage + IndexedDB
```

### React Native Flow

```
suite-native/suite-sync/src/initSuiteSyncNative.ts
    ↓ imports
createJazzInstanceNative.ts
    ↓ uses
jazz-tools/expo + jazz-tools/react-native-core
    ↓ uses
expo-secure-store + expo-sqlite
```

## Benefits of This Architecture

1. **Platform Optimization**: Each platform uses the most efficient APIs available
2. **Type Safety**: TypeScript ensures both implementations match the interface
3. **Maintainability**: Shared business logic in `suite-common`, platform code isolated
4. **Testability**: Can mock the factory in tests without platform dependencies
5. **Future-Proof**: Easy to add new platforms (e.g., Electron native, other mobile frameworks)

## Migration Notes

The previous implementation had `createJazzInstance.ts` in `suite-common` which used browser-specific APIs. This caused React Native to fail because:

❌ **Before**:

```typescript
// In suite-common (imported by both platforms)
import { LocalStorageKVStore, createJazzBrowserContext } from 'jazz-tools/browser';
// ↑ This breaks React Native!
```

✓ **After**:

```typescript
// In suite/suite-sync (browser only)
import { LocalStorageKVStore, createJazzBrowserContext } from 'jazz-tools/browser';

// In suite-native/suite-sync (native only)
import { ExpoSecureStoreAdapter, ... } from 'jazz-tools/expo';
import { createJazzReactNativeContext } from 'jazz-tools/react-native-core';
```

## Dependencies

### Browser/Desktop Packages

```json
{
    "dependencies": {
        "jazz-tools": "^x.x.x" // includes /browser subpath
    }
}
```

### React Native Packages

```json
{
    "dependencies": {
        "jazz-tools": "^x.x.x", // includes /expo and /react-native-core
        "expo-secure-store": "^x.x.x",
        "expo-sqlite": "^x.x.x",
        "@react-native-community/netinfo": "^x.x.x"
    }
}
```

## Testing Considerations

When testing, each platform should:

1. Mock its own `createJazzInstanceFactory`
2. Provide test implementations of storage adapters
3. Test the specific platform APIs are called correctly

Example for browser tests:

```typescript
jest.mock('./createJazzInstanceBrowser', () => ({
    createJazzInstanceFactory: () => mockBrowserFactory,
}));
```

Example for native tests:

```typescript
jest.mock('./createJazzInstanceNative', () => ({
    createJazzInstanceFactory: () => mockNativeFactory,
}));
```
