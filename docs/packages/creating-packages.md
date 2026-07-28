# How to create new package?

1. Use `yarn generate-package @scope/new-package-name` - it will generate package boilerplate in `scope/new-package-name` folder.

## How to use this new package?

1. Place this package to dependency field of package.json in package where you want to use it.
1. Run `yarn refs` to generate tsconfig refs.
1. Run `yarn` to let yarn symlink this package.

## How to publish this new package to npm?

Only needed for packages with `publishConfig` that end up in the `@trezor/connect` dependency tree,
those are published by the `[Release] Connect NPM` workflow.

The workflow authenticates to npm with OIDC ([trusted publishing](https://docs.npmjs.com/trusted-publishers/)),
and npm can only configure a trusted publisher for a package that already exists on the registry. So a
brand-new name has to be reserved once, locally, by a maintainer with npm publish rights:

```bash
yarn reserve-npm-package network-tron
```

That publishes a `0.0.0-reserved` placeholder (uninstallable, published under the `reserved` dist tag)
and configures GitHub Actions as the trusted publisher. Afterwards the release workflow publishes the
package like any other one. Add `--dry-run` to preview both steps without touching the registry.

Skipping this fails the release in the `Check npm package names are reserved` job, and if it were
skipped there it would fail mid-release with `YN0033: No authentication configured for request`. The
same reservation is also listed as a checklist item in the version bump PR comment. Renaming an
already published package counts as a new name and needs a new reservation.
