# Publishing @trezor package to npm registry

`npm publish` could be done manually on [gitlab CI](https://gitlab.com/satoshilabs/trezor/trezor-suite/-/pipelines/) in `Deploy to dev` phase.

### Purpose

@trezor packages are dependencies of `trezor-connect` API which is currently developed in a separated [repository](https://github.com/trezor/connect/).

Publish is required to distribute changes to `trezor-connect` and make them available for 3rd party implementations and have everything synced.

### Prerequisites

1. Update `CHANGELOG.md` and list all changes since the last release of the package.
1. Bump the version in `packages/<PACKAGE-NAME>/package.json`. Use the [semver](https://semver.org/) convention.

### Production

1. Create new branch with `release/` prefix.
1. Commit your changes as `release: @trezor/<PACKAGE-NAME> X.X.X`.
1. Use `<PACKAGE-NAME> deploy npm` job.

### Beta

If you want to publish to npm as `beta` (from any branch) do the following:

1. Change the version in `packages/<PACKAGE-NAME>/package.json` from `X.X.X` to `X.X.(X + 1)-beta.1`.
   The `-beta.<n>` suffix is important because NPM registry doesn't allow overriding already published versions.
   With this suffix we can publish multiple beta versions for a single patch.
1. Commit your changes as `release: @trezor/<PACKAGE-NAME> X.X.X-beta.X`.
1. Use `beta <PACKAGE-NAME> deploy npm` job.


### Release new trezor-connect with updated package.

1. Upgrade the version of the package in `devDependencies` and `extendedDependencies` of `trezor-connect`.
1. Create [new beta release of trezor-connect](https://github.com/trezor/connect/blob/83af30f73f4cfa7c099c55b2b0f8a103abc299c8/docs/deployment/index.md#beta).
1. Use new trezor-connect in Suite. Upgrade `trezor-connect` dependency in `packages/*/package.json`