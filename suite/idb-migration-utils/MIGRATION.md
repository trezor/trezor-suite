# Suite IDB Migration Guide

## Version encoding

IndexedDB requires its **version** to be a single integer, while Suite follows **SemVer**
(`major.minor.patch`). We pack every release into one 32-bit number so that integer
ordering == SemVer ordering.

### Layout

| Bit range | Stored value |
| --------- | ------------ |
| 31 – 24   | `major`      |
| 23 – 16   | `minor`      |
| 15 – 8    | `patch`      |
| 7 – 0     | `revision`   |

```typescript
encoded = (major << 24) | (minor << 16) | (patch << 8) | revision;
```

> The optional revision allows multiple internal database migrations within the same Suite release without changing the public app version.

### Examples

| Version           | Encoded (hex) | Encoded (dec) |
| ----------------- | ------------- | ------------- |
| `1.0.0`           | `0x01000000`  | 16 777 216    |
| `2.5.3`           | `0x02050300`  | 33 882 880    |
| `25.7.0`          | `0x19070000`  | 419 889 152   |
| `25.7.0.1`        | `0x19070001`  | 423 362 561   |
| `255.255.255.255` | `0xFFFFFFFF`  | 4 294 967 295 |

> Each component must be 0-255. The max representable value is `0xFFFFFFFF` (4 294 967 295).

### Backwards compatibility

Old database versions used:

- plain **integer** versions (0 - 57)
- **24-bit** SemVer versions up to `25.10.0`

All **24-bit** values are ≤ `0xFFFFFF`, while the **32-bit** encoded versions start at `0x01000000`.
Therefore, every **32-bit** encoded version is higher than any earlier schema, and automatic upgrades work seamlessly.

## Creating a migration

#### 1. Run the scaffold

```bash
yarn workspace @trezor/suite make:migration [version]
```

There are several ways of how to call the command:

```bash
// Create first migration for given version (fails if already exists)
yarn workspace @trezor/suite make:migration 25.11.0

// Create follow-up migration (revision = 1)
yarn workspace @trezor/suite make:migration 25.11.0.1

// Auto-detect current Suite version and create the next revision automatically (e.g. .1, .2, ...)
// This is the recommended way as you don't have to think about the version
yarn workspace @trezor/suite make:migration
```

The script will:

- create `src/storage/migrations/versions/<versionString>.ts` in `suite` package (e.g. `25.11.0.ts` or `25.11.0.1.ts`)
- append `export { default as m25_11_0_1 } from './25.11.0.1';` to `.../versions/index.ts`
- for base migrations (rev = 0), prepend `## x.y.z` to `src/storage/CHANGELOG.md`
- for revisions (rev > 0), skip changelog updates

#### 2. Implement the migration in the generated file

```typescript
// src/storage/migrations/versions/25.11.0.1.ts
export default createMigration('25.11.0.1', db => {
    db.createObjectStore('example');
});
```

#### 3. Update the CHANGELOG

#### 4. Done 🎉
