# Suite IDB Migration Guide

## Version encoding

IndexedDB requires its **version** to be a single integer, while Suite follows **SemVer**
(`major.minor.patch`). We pack every release into one 24-bit number so that integer
ordering == SemVer ordering.

### Layout

| Bit range | Stored value |
| --------- | ------------ |
| 23 – 16   | `major`      |
| 15 – 8    | `minor`      |
| 7 – 0     | `patch`      |

```typescript
encoded = (major << 16) | (minor << 8) | patch;
```

### Examples

| SemVer        | Encoded (hex) | Encoded (dec) |
| ------------- | ------------- | ------------- |
| `1.0.0`       | `0x010000`    | 65 536        |
| `2.5.3`       | `0x020503`    | 132 611       |
| `25.7.0`      | `0x190700`    | 1 640 192     |
| `255.255.255` | `0xFFFFFF`    | 16 777 215    |

> Each component must be 0-255. The max representable value is `0xFFFFFF` (16 777 215).

### Backwards compatibility

The original schema used simple **integer** versions that incremented
with every change and stopped at **57**.
From release **25.7.0** onward we switch to the 24-bit SemVer encoding.

As can be seen in the examples section, the encoded decimal value for `25.7.0` is `1 640 192`.
Since **1 640 192 > 57**, every packed SemVer value is _guaranteed_ to be
higher than any legacy version.

## Creating a migration

#### 1. Run the scaffold

```bash
yarn workspace @trezor/suite make:migration <major.minor.patch>

# example
yarn workspace @trezor/suite make:migration 25.8.0
```

The script will:

- create `src/storage/migrations/versions/25.8.0.ts` in `suite` package
- append `export { default as m25_8_0 } from './25.8.0'; to .../versions/index.ts`
- prepend `## 25.8.0` to `src/storage/CHANGELOG.md`

#### 2. Implement the migration in the generated file

```typescript
// src/storage/migrations/versions/25.8.0.ts
export default createMigration('25.8.0', db => {
    db.createObjectStore('example');
});
```

#### 3. Update the CHANGELOG

#### 4. Done 🎉
