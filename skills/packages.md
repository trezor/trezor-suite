# Packages

## How to create packages

Use command `yarn generate-package @scope/newPackageName`. For example using name `@suite-common/wallet` will create package in `/suite-common` folder.

For top-level package placement, see `project-structure.md`.

When you add a dependency on another workspace package, run `yarn refs`.

This updates project references so TypeScript and workspace builds stay in sync.

## Package placement

When deciding where a new package belongs:

1. Domain-agnostic code belongs in `packages/`.
2. Shared Suite-domain code belongs in `suite-common/`.
3. Web/desktop-specific Suite code belongs in `suite/`.
4. Mobile-specific Suite code belongs in `suite-native/`.

## Import directions

- `@trezor/*` packages must stay domain-agnostic and must not import app scopes.
- `@suite-common/*` may import `@trezor/*`.
- `@suite/*` may import `@trezor/*` and `@suite-common/*`.
- `@suite-native/*` may import `@trezor/*` and `@suite-common/*`.

## Package boundaries

Some packages mainly assemble screens, routes, stacks, flows, or other app-specific wiring. Other packages provide reusable domain logic, state, UI, or helpers.

Composition packages (modules) should stay thin and should not become dependencies of other composition packages.

Shared code used by multiple module packages belongs in a reusable package.

This keeps dependencies one-directional, reduces circular references, and makes extraction easier.

In mobile, `module-*` packages are usually packages routing packages for `StackNavigators`. If code from one `module-*` package is needed in another, that code likely belongs in a reusable package, not in either module.

## Refactoring heuristics

- Code shared by two composition packages (modules) should be extracted into a reusable package.
- Packages that mostly wire screens, routes, stacks, or providers together should stay thin.
- Reusable state and domain logic should move lower instead of staying in app wiring.
- Many imports from sibling feature packages usually mean the boundary is wrong.
- Broad topics like `device` should not become dumping grounds. Decide whether the code truly belongs there or should be a separate package.

## Circular dependencies

- Do not patch circular dependencies with deeper or more specific imports.
- Find the shared code both sides need and move it into a lower-level reusable package.
- When a module is part of the cycle, keep the wiring there and move reusable logic out.
- When a broad package is part of the cycle, split its responsibility instead of adding more exceptions.

## Packages size

Smaller is better.

Large packages tend to become monoliths and create cyclic dependencies.

If two packages need to share a type or helper, prefer extracting a smaller package with that shared responsibility instead of merging more code into an already large package.

Smaller packages usually mean:

1. clearer boundaries,
2. fewer cyclic dependencies,
3. smaller and faster lint, test, and type-check scope.
