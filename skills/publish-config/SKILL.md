---
name: publish-config
description: publishConfig rules for public npm packages in the Trezor Suite monorepo. Use when adding or editing publishConfig, exports, or preparing a package for npm publishing.
---

# Publish Config

Validated by `requirePublishConfig` in `@trezor/requirements` (`packages/requirements/src/requirements/package-json/requirePublishConfig.ts`).

Applies to any package with `publishConfig`.

## Rules

1. **Top-level `main`** — required (e.g. `"./src/index.ts"`).
2. **`files`** — must include `"lib/"` and `"libESM/"`.
3. **`publishConfig.main`** and **`publishConfig.types`** — both required.
4. **`publishConfig.exports["."]`** — must have exact dual CJS/ESM shape (see example).
5. **Wildcard exports** — CJS (`./lib/*`) uses an object with `types` and `default`. ESM (`./libESM/*`) must be a passthrough string (`"./libESM/*"`) — an object would double the `.mjs` extension.
6. **Explicit (non-wildcard) exports** — not shape-checked (intentional overrides), but must still have a counterpart. Typically used to route a directory import to its `index.js`, e.g. `"./lib/protocol-thp": { "types": "./lib/protocol-thp/index.d.ts", "default": "./lib/protocol-thp/index.js" }` — without this, the wildcard would resolve to `protocol-thp.js` instead of `protocol-thp/index.js`.
7. **lib/libESM counterpart** — every `./lib/...` entry needs a matching `./libESM/...` pair and vice versa.
8. **Key order** — `"types"` must come before `"default"` in every condition object (recursive). TypeScript evaluates conditions in declaration order.

## Example

```jsonc
{
    "name": "@trezor/example",
    "main": "./src/index.ts", // Rule 1
    "files": ["lib/", "libESM/", "CHANGELOG.md"], // Rule 2
    "publishConfig": {
        "main": "./lib/index.js", // Rule 3
        "types": "./lib/index.d.ts", // Rule 3
        "exports": {
            ".": {
                // Rule 4: exact shape required
                "import": {
                    "types": "./libESM/index.d.mts", // Rule 8: "types" before "default"
                    "default": "./libESM/index.mjs",
                },
                "require": {
                    "types": "./lib/index.d.ts",
                    "default": "./lib/index.js",
                },
            },
            "./lib/*": {
                // Rule 5: CJS wildcard — object
                "types": "./lib/*.d.ts",
                "default": "./lib/*.js",
            },
            "./libESM/*": "./libESM/*", // Rule 5: ESM wildcard — passthrough string
        },
    },
}
```
