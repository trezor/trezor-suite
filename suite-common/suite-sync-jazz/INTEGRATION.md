# Jazz Integration Guide

This guide shows how to integrate Jazz into your Trezor Suite application.

## Architecture Overview

```
React App Root (Provider)
    ↓
JazzReactProvider / JazzExpoProvider
    ↓
JazzContextProvider (sets global account)
    ↓
Redux Store (extraDependencies)
    ↓
suite-sync (uses global account via getGlobalJazzAccount)
```

## Web/Desktop Integration

### 1. Wrap your app with JazzReactProvider

```tsx
// In your main app file (e.g., packages/suite/src/views/suite/index.tsx)
import { JazzReactProvider } from 'jazz-tools/react';
import {
    SuiteSyncAccount,
    JazzContextProvider,
    setGlobalJazzAccount,
} from '@suite-common/suite-sync-jazz';
import { useAccount } from 'jazz-tools/react';

// Wrapper component to bridge Jazz context to global state
function JazzBridge({ children }: { children: React.ReactNode }) {
    const account = useAccount(SuiteSyncAccount, {
        resolve: {
            root: {
                walletLabels: true,
                accountLabels: true,
                addressLabels: true,
                outputLabels: true,
            },
        },
    });

    // Update global reference when account changes
    React.useEffect(() => {
        if (account.$isLoaded) {
            setGlobalJazzAccount(account);
        }
    }, [account.$isLoaded]);

    return (
        <JazzContextProvider
            account={account.$isLoaded ? account : null}
            isLoaded={account.$isLoaded}
        >
            {children}
        </JazzContextProvider>
    );
}

// In your app root
function App() {
    return (
        <JazzReactProvider
            sync={{
                peer: 'ws://localhost:4200', // or production Jazz server
                when: 'always',
            }}
            AccountSchema={SuiteSyncAccount}
        >
            <JazzBridge>
                {/* Your existing app */}
                <YourAppComponent />
            </JazzBridge>
        </JazzReactProvider>
    );
}
```

### 2. Redux store continues to work automatically

The `createSuiteSyncDesktop` in extraDependencies will automatically use the Jazz account set by `JazzBridge`.

```typescript
// In packages/suite/src/support/extraDependencies.ts (already updated)
export const suiteExtraFactory: ExtraWithStoreFactory = store => ({
    services: {
        suiteSync: createSuiteSyncDesktop(store), // This now uses Jazz!
        // ...
    },
});
```

## React Native Integration

### 1. Install Expo dependencies

```bash
npx expo install expo-sqlite
```

### 2. Wrap your app with Jazz Expo provider

```tsx
// In your main app file (e.g., suite-native/app/App.tsx)
import { JazzExpoProvider } from 'jazz-tools/react-native-expo';
import {
    SuiteSyncAccount,
    JazzContextProvider,
    setGlobalJazzAccount,
} from '@suite-common/suite-sync-jazz';
import { useAccount } from 'jazz-tools/react-native-expo';

// Bridge component (same as web)
function JazzBridge({ children }: { children: React.ReactNode }) {
    const account = useAccount(SuiteSyncAccount, {
        resolve: {
            root: {
                walletLabels: true,
                accountLabels: true,
                addressLabels: true,
                outputLabels: true,
            },
        },
    });

    React.useEffect(() => {
        if (account.$isLoaded) {
            setGlobalJazzAccount(account);
        }
    }, [account.$isLoaded]);

    return (
        <JazzContextProvider
            account={account.$isLoaded ? account : null}
            isLoaded={account.$isLoaded}
        >
            {children}
        </JazzContextProvider>
    );
}

// In your app root
function App() {
    return (
        <JazzExpoProvider
            sync={{
                peer: 'ws://localhost:4200', // or production Jazz server
                when: 'always',
            }}
            AccountSchema={SuiteSyncAccount}
        >
            <JazzBridge>
                {/* Your existing app */}
                <YourNativeAppComponent />
            </JazzBridge>
        </JazzExpoProvider>
    );
}
```

### 3. Redux store (already configured)

The `initSuiteSyncNative` in extraDependencies will automatically use the Jazz account.

## Configuration

### Sync Server URL

Configure the sync server in `suite-common/suite-sync/src/relay/relayUrl.ts`:

```typescript
export const DEFAULT_SUITE_SYNC_RELAY_URL = isDevEnv
    ? 'ws://localhost:4200' // Local development
    : 'wss://cloud.jazz.tools/?key=xxx'; // Production
```

### Running Local Sync Server

For development:

```bash
# Option 1: NPX
npx jazz-run sync --port 4200

# Option 2: Docker
docker run -p 4200:4200 jazz/sync-server
```

### Production Setup

1. Get an API key from [dashboard.jazz.tools](https://dashboard.jazz.tools)
2. Update the production URL: `wss://cloud.jazz.tools/?key=your-api-key`

## Authentication

Jazz uses the existing Suite authentication:

1. Device state is converted to Jazz credentials via `jazzCreateSuiteSyncOwner`
2. The owner secret is derived from the device
3. Each device gets its own Jazz account
4. Data is end-to-end encrypted using device keys

## How It Works

1. **App starts** → JazzReactProvider/JazzExpoProvider initializes Jazz
2. **Account loads** → useAccount hook loads the SuiteSyncAccount
3. **Bridge updates** → JazzBridge sets the global account reference
4. **Redux initializes** → extraDependencies calls createSuiteSyncDesktop/Native
5. **Storage created** → Jazz storage uses the global account reference
6. **Data syncs** → Labels sync automatically across devices

## Testing

You can test Jazz integration:

```typescript
import { useJazzAccount } from '@suite-common/suite-sync-jazz';

function TestComponent() {
    const { account, isLoaded } = useJazzAccount();

    if (!isLoaded) {
        return <div>Loading Jazz...</div>;
    }

    return (
        <div>
            Jazz Account ID: {account.$jazz.id}
            Labels: {account.root.walletLabels.length}
        </div>
    );
}
```

## Troubleshooting

### "Jazz account not initialized"

Make sure:

1. JazzReactProvider (web) or JazzExpoProvider (native) wraps your app
2. JazzBridge component is used to set the global account
3. Account has finished loading before Redux accesses it

### Sync not working

1. Check the sync server is running on port 4200
2. Verify WebSocket connection in network tab
3. Check Jazz console logs for errors

### Data not persisting

1. Jazz uses IndexedDB (web) or SQLite (native)
2. Check browser/app permissions
3. Verify account migration ran successfully

## Migration from Evolu

To migrate existing Evolu data:

1. Export labels from Evolu before switching
2. Initialize Jazz with the new provider
3. Import labels into Jazz using the storage API

See the migration guide for detailed steps.



