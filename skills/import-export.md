# Import/Export

## Use named export only

1. **Consistency.** With named exports you can always be sure that the exported value will not be renamed at one point. It’s much easier to refactor with named exports because you can mass-replace and be more confident that it covered everything. Same goes for searching for a value.
2. **Tree-shaking.** With named exports, Webpack can recognize which exported values are unused and eliminate them. If you want to import all exports from a file and not use default exports, – use:

    ```tsx
    import * as colorUtils from './utils.js';
    ```

## Barrel (index.ts) files

Use them in packages to define public interface.

Do not use them inside a module to export from directory. If you feel it shall be separated, create a new package. They can introduce accidental circular dependencies and may hurt tree-shaking.

## No re-exports

Do not use re-exports except in a package entrypoint.

Within a package, import symbols directly from the file where they are defined. Use `index.ts` re-exports only to define the package's public API.
