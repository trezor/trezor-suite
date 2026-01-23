# Import/Export

## Use named export only

1. **Consistency.** With named exports you can always be sure that the exported value will not be renamed at one point. It’s much easier to refactor with named exports because you can mass-replace and be more confident that it covered everything. Same goes for searching for a value.
2. **Tree-shaking.** With named exports, Webpack can recognize which exported values are unused and eliminate them. If you want to import all exports from a file and not use default exports, – use:

    ```tsx
    import * as colorUtils from './utils.js';
    ```

## When to use `import type`?

1. If you are compiling code using TS **`tsc`, compiler knows full context and will remove import statement** even without `type` anotation because compiler knows what is type and what is value. You can try and check this in `/libDev` output. You can even combine type and value in one import and will correctly strip only types.
2. If you are using `babel` to compile TS, like we do in Webpack that builds Suite, Babel can't tell if it's a type or a value from the import statement. Babel always works in only one file context, but it can tell from usage in rest of file:

```
import { colors, Color } from './colors';
// babel see here it is used as type
const getColor = (colorName: Color) => colors[colorName];
```

Babel see that `Color` is used as type and can safely remove `Color` from code even when it doesn't see context of other files. So what will happen if `babel` can't tell from usage if it's import or value? Consider this code:

```
import { Color } from './colors';
export { Color };
```

In this case, Babel has no idea if it can remove `Color` or not. Luckily we have everywhere enabled TS option `isolatedModules: true,` which will throw TS error in all cases where it's not clear if it's value or type and ask you to explicitly add `import type`, so Babel will know what can be removed. These are all scenarios that can occur. In the past you probably needed to add `import type` because TS was not properly configured with `isolatedModules: true` option, but that is already fixed. To sum it up: **You don't need to use `import type` unless TS throws an error and explicitly asks you to do that.**

Note that `import type` can have some effect in tools based on static analysis. You can tell Eslint this way that it's only a type so it will be ignored. But again you need to add it only when error occurs.
