---
name: import-export
description: Named export conventions and barrel file usage rules for the Trezor Suite codebase. Use when writing imports, exports, or deciding on module structure.
---

# Import/Export

## Use named export only

1. **Consistency.** With named exports you can always be sure that the exported value will not be renamed at one point. It's much easier to refactor with named exports because you can mass-replace and be more confident that it covered everything. Same goes for searching for a value.
2. **Tree-shaking.** With named exports, Webpack can recognize which exported values are unused and eliminate them. If you want to import all exports from a file and not use default exports, – use:

    ```tsx
    import * as colorUtils from './utils.js';
    ```

## Barrel (index.ts) files

Use them in packages to define public interface.

Do not use them inside a module to export from directory. If you feel it shall be separated, create a new package. They can introduce accidental circular dependencies and may hurt tree-shaking.

`@trezor/suite` has no index files under `src/`; its only barrels are the package entry points (`index.ts`, `mocks/index.ts`). Import from the defining module, and name a module after what it contains instead of `index`.

## Imports within a package

Import modules of the same package relatively, or through the package's `#src/*` [subpath import](https://nodejs.org/api/packages.html#subpath-imports) where its `package.json` declares one (`@trezor/suite`):

```tsx
import { useSelector } from '#src/hooks/suite/useSelector';
```

`#src` resolves only inside the declaring package, so it never reaches into another package. Do not add `#src` to `suite-native` packages (Metro) or published packages; use relative imports there. Do not add new import aliases through tsconfig `paths` or bundler aliases.
