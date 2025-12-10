# @suite-common/suite-sync-jazz

Jazz.tools integration for Trezor Suite synchronization.

## Overview

This package provides a Jazz-based implementation of the Suite Sync storage interface, replacing the previous Evolu implementation. Jazz is a distributed database that syncs structured data across devices in real-time with built-in encryption and offline support.

## Features

- **Real-time sync**: Data syncs instantly across all devices
- **Offline-first**: Full offline support with automatic sync when back online
- **End-to-end encryption**: Data is encrypted using device keys
- **Label synchronization**: Syncs wallet, account, address, and output labels

## Architecture

The package consists of several key components:

### Schema (`src/schema.ts`)

Defines the Jazz CoMap schemas for:

- `WalletLabelSchema`: Labels for wallets
- `AccountLabelSchema`: Labels for accounts
- `AddressLabelSchema`: Labels for addresses
- `OutputLabelSchema`: Labels for transaction outputs
- `SuiteSyncRoot`: Root container for all label collections
- `SuiteSyncAccount`: Account schema with migrations

### Label Stores (`src/labeling/`)

Implements the storage interface for each label type:

- `WalletLabels`: Manages wallet labels
- `AccountLabels`: Manages account labels
- `AddressLabels`: Manages address labels
- `OutputLabels`: Manages output labels

Each store provides:

- `update(label)`: Create or update a label
- `subscribe(onChange)`: Subscribe to label changes

### Instance Creation (`src/createJazzInstance.ts`)

Factory for creating Jazz instances with:

- Credential derivation from Suite owner secrets
- Connection to sync server
- Account initialization and migration

### Storage Factory (`src/jazzStorage.ts`)

Creates the SuiteSyncStorage interface that integrates with the suite-sync package.

### Owner Creation (`src/jazzCreateSuiteSyncOwner.ts`)

Converts Trezor device data to Jazz credentials.

## Configuration

### Sync Server

The default sync server is configured in `suite-common/suite-sync/src/relay/relayUrl.ts`:

- **Development**: `ws://localhost:4200` (local Jazz sync server)
- **Production**: `wss://cloud.jazz.tools/?key=<api-key>` (Jazz cloud)

### Running a Local Sync Server

To run a local Jazz sync server on port 4200:

```bash
npx jazz-run sync --port 4200
```

Or use Docker:

```bash
docker run -p 4200:4200 jazz-tools/sync-server
```

## Integration

The Jazz integration is used in two places:

### Desktop/Web (`suite/suite-sync/src/index.ts`)

```typescript
import { createJazzStorageFactory, jazzCreateSuiteSyncOwner } from '@suite-common/suite-sync-jazz';
import { createJazzInstanceFactory } from './createJazzInstanceBrowser'; // Platform-specific

const createJazzInstance = createJazzInstanceFactory();
const createJazzStorage = createJazzStorageFactory({ createJazzInstance });

createSuiteSyncCompositionRoot({
    createSuiteStorage: createJazzStorage,
    createSuiteSyncOwner: jazzCreateSuiteSyncOwner,
    // ...
});
```

### React Native (`suite-native/suite-sync/src/initSuiteSyncNative.ts`)

```typescript
import { createJazzStorageFactory, jazzCreateSuiteSyncOwner } from '@suite-common/suite-sync-jazz';
import { createJazzInstanceFactory } from './createJazzInstanceNative'; // Platform-specific

const createJazzInstance = createJazzInstanceFactory();
const createJazzStorage = createJazzStorageFactory({ createJazzInstance });

createSuiteSyncCompositionRoot({
    createSuiteStorage: createJazzStorage,
    createSuiteSyncOwner: jazzCreateSuiteSyncOwner,
    // ...
});
```

**Note**: The integration is the same across platforms, but `createJazzInstanceFactory` is now platform-specific:

- Browser/Desktop uses `LocalStorageKVStore` and IndexedDB
- React Native uses `ExpoSecureStoreAdapter` and SQLite

## Data Model

Labels are stored as CoLists (collaborative lists) within the account root:

```typescript
SuiteSyncRoot {
    walletLabels: CoList<WalletLabel>
    accountLabels: CoList<AccountLabel>
    addressLabels: CoList<AddressLabel>
    outputLabels: CoList<OutputLabel>
}
```

Each label type contains:

- Unique identifiers (descriptor, address, txId, etc.)
- Label string (nullable)
- Network information

## Security

- Account credentials are derived from the device's owner secret
- All data is end-to-end encrypted by Jazz
- Only devices with the correct credentials can access the data
- Sync server cannot read the encrypted data

## Migration from Evolu

The Jazz implementation maintains the same interface as the Evolu implementation, making the migration transparent to the rest of the Suite codebase. The key changes are:

1. **Schema format**: CoMaps instead of SQL tables
2. **Data structure**: CoLists for collections instead of queries
3. **Sync protocol**: WebSocket-based Jazz sync instead of HTTP
4. **Storage**: IndexedDB/SQLite via Jazz instead of Evolu's SQLite

Existing label data will need to be migrated from Evolu to Jazz format.

## Limitations & TODOs

1. **Account creation**: The current implementation assumes accounts are created through the Jazz provider. Full programmatic account creation needs to be implemented.

2. **Worker API**: The implementation uses `jazz-tools/worker` which is designed for server-side usage. A client-side approach using `JazzReactProvider` or a custom LocalNode may be more appropriate.

3. **Data migration**: No automatic migration from Evolu to Jazz is implemented yet.

4. **Testing**: Comprehensive tests need to be added.

5. **Error handling**: More robust error handling and retry logic needed.

## Dependencies

- `jazz-tools`: ^0.19.3 - Jazz framework
- `@suite-common/suite-sync-storage`: Workspace package - Storage interfaces
- `@suite-common/suite-types`: Workspace package - Type definitions
- `@suite-common/wallet-config`: Workspace package - Network configuration
- `@suite-common/wallet-types`: Workspace package - Wallet types

## Development

```bash
# Type check
yarn type-check

# Run tests
yarn test:unit

# Lint
yarn lint:js

# Dependency check
yarn depcheck
```

## Resources

- [Jazz Documentation](https://jazz.tools/docs)
- [Jazz GitHub](https://github.com/garden-co/jazz)
- [Jazz Discord](https://discord.gg/utDMjHYg42)
