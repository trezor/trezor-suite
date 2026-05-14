---
name: idb-migrations
description: How to create and implement IndexedDB storage migrations in the Trezor Suite web app. Use when writing migrations that transform persisted data between Suite versions.
---

# IDB Storage Migrations

## Overview

Suite uses IndexedDB for persistent storage. When the data schema changes between versions, a migration transforms old data to match the new shape. Migrations live in `packages/suite/src/storage/migrations/versions/`.

## Creating a Migration

### Step 1: Scaffold

```bash
# Auto-detect version (recommended)
yarn workspace @trezor/suite make:migration

# Specific version
yarn workspace @trezor/suite make:migration 26.5.0

# Revision within a version
yarn workspace @trezor/suite make:migration 26.5.0.1
```

This creates the migration file and updates the auto-generated index at `packages/suite/src/storage/migrations/versions/index.ts`.

### Step 2: Implement

Every migration file uses `createMigration` from `@suite/idb-migration-utils` and default-exports the result.

#### Minimal (schema-only) migration

Use when creating/deleting object stores — no data transformation needed:

```ts
import { createMigration } from '@suite/idb-migration-utils';
import { type SuiteDBSchema } from 'src/storage/definitions';

export default createMigration<SuiteDBSchema>('26.5.0', db => {
    db.createObjectStore('newStore');
});
```

#### Data transformation migration

Use `updateAll` from `../utils` to iterate and transform all records in a store. The callback receives each record and must return:

- **the updated record** to update it
- **`null`** to delete it
- **`undefined`/void** to leave it untouched

```ts
import { createMigration } from '@suite/idb-migration-utils';
import { type SuiteDBSchema } from 'src/storage/definitions';
import { updateAll } from '../utils';

export default createMigration<SuiteDBSchema>('26.5.0', async (_, tx) => {
    await updateAll(tx, 'devices', device => {
        // Add a new field with a default value
        if (!device.newField) {
            device.newField = 'default';
        }
        return device;
    });
});
```

#### Accessing multiple stores

The migration callback receives `(db, tx)` where `db` is the database and `tx` is the versionchange transaction. You can access any store via `tx.objectStore('storeName')`:

```ts
export default createMigration<SuiteDBSchema>('26.5.0', async (db, tx) => {
    // Read from a store directly
    const store = tx.objectStore('suiteSettings');
    const settings = await store.get('suite');

    // Modify and write back
    if (settings) {
        settings.someField = 'newValue';
        await store.put(settings, 'suite');
    }

    // Also transform another store
    await updateAll(tx, 'devices', device => {
        device.field = 'value';
        return device;
    });
});
```

#### Accessing deleted stores

When a store was removed from `SuiteDBSchema`, use `@ts-expect-error` to access it:

```ts
// @ts-expect-error storeName no longer exists
if (db.objectStoreNames.contains('oldStore')) {
    // @ts-expect-error storeName no longer exists
    const store = tx.objectStore('oldStore');
    const data = await store.get('key');
    // ... migrate data to new location
    // @ts-expect-error storeName no longer exists
    db.deleteObjectStore('oldStore');
}
```

### Step 3: Update the CHANGELOG

For base migrations (revision 0), a `## x.y.z` header is auto-added to `packages/suite/src/storage/CHANGELOG.md`. Add a description of what the migration does under it.

## Key Stores

| Store                  | Key      | Description                                                                 |
| ---------------------- | -------- | --------------------------------------------------------------------------- |
| `devices`              | `string` | Remembered devices (`DeviceWithEmptyPath`)                                  |
| `persistentDeviceData` | `string` | Device metadata that persists across connections (`PersistentDeviceData[]`) |
| `suiteSettings`        | `string` | Suite settings, flags, EVM settings                                         |
| `accounts`             | `string` | Wallet accounts                                                             |
| `txs`                  | `string` | Wallet transactions                                                         |

Full schema: `packages/suite/src/storage/definitions.ts` (`SuiteDBSchema`)

## Version Encoding

IndexedDB version is a 32-bit integer encoding SemVer: `(major << 24) | (minor << 16) | (patch << 8) | revision`. Each component is 0-255. See `suite/idb-migration-utils/MIGRATION.md` for details.

## Important Notes

- Migration files must **default-export** the `createMigration` result
- The `versions/index.ts` file is **auto-generated** — use the scaffold command, don't edit manually
- Use `@ts-expect-error` for accessing stores/fields that no longer exist in the current schema
- Always guard with `if` checks before accessing potentially missing data
- The `updateAll` utility handles cursor iteration — just provide the transform function
