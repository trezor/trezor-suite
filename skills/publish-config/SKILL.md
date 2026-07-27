---
name: publish-config
description: publishConfig rules for public npm packages in the Trezor Suite monorepo. Use when adding or editing publishConfig, exports, or preparing a package for npm publishing.
---

# Publish Config

Validated by `requirePublishConfig` in `@trezor/requirements` (`packages/requirements/src/requirements/package-json/requirePublishConfig.ts`).

Applies to any package with `publishConfig`.

## Rules

1. **Top-level `main`** — required (e.g. `"./src/index.ts"`).
2. **`files`** — must include `"lib/"`.
3. **`publishConfig.main`** and **`publishConfig.types`** — both required.
4. **`publishConfig.exports["."].default`** and **`publishConfig.exports["."].types`** — must export the same files as in Rule 3.
5. **Wildcard exports** — (`./lib/*`) must be a passthrough string (`"./lib/*"`) — an object would double the `.js` extension.
6. **Explicit (non-wildcard) exports** — not shape-checked (intentional overrides). Typically used to route a directory import to its `index.js`, e.g. `"./lib/protocol-thp": { "types": "./lib/protocol-thp/index.d.ts", "default": "./lib/protocol-thp/index.js" }` — without this, the wildcard would resolve to `protocol-thp.js` instead of `protocol-thp/index.js`.
7. **Key order** — `"types"` must come before `"default"` in every condition object (recursive). TypeScript evaluates conditions in declaration order.
8. **`type`** — must declare top-level `"type": "module"`. Do not duplicate it under `publishConfig.type` — `publishConfig` would only shadow the top level with the same value at publish time, so we keep a single source of truth.

## Example

```jsonc
{
    "name": "@trezor/example",
    "main": "./src/index.ts", // Rule 1
    "type": "module", // Rule 8
    "files": ["lib/", "CHANGELOG.md"], // Rule 2
    "publishConfig": {
        "main": "./lib/index.js", // Rule 3
        "types": "./lib/index.d.ts", // Rule 3
        "exports": {
            ".": {
                // Rule 4: exact shape required
                "types": "./lib/index.d.ts", // Rule 7: "types" before "default"
                "default": "./lib/index.js",
            },
            // Rule 5: ESM wildcard — passthrough string
            "./lib/*": "./lib/*",
        },
    },
}
```
