# Adding New Firmwares

In case we are about to release both Suite and firmwares we want to add the signed binaries during the Freeze so QA has the whole thing to test.

Binaries and release definitions are stored in `packages/connect-common/files/firmware/*` in the same data structure as they were in the past (data.trezor.io). They are used by `suite-web` and `suite-desktop` builds.

Package `@trezor/connect-common` is a public NPM package used as dependency of `trezor-connect`.

## Add firmwares

1. Complete the firmware release process including firmware signing.
1. Add firmwares to `packages/connect-common/files/firmware/*` and modify its `releases.json` file. See e.g. [a1831647](https://github.com/trezor/webwallet-data/commit/f8ed15a8999689e7692b8fc4c00b7aaef25d8011) for an example.
1. `git lfs push --all origin [YOUR-BRANCH-NAME]`
1. Optionally if you want to test it locally run `yarn workspace @trezor/connect-iframe build:lib` to rebuild connect files and `yarn workspace @trezor/suite-web dev` to use/copy them.

## Freeze & Release

1. Freeze Suite. At this moment you are all good to _Freeze_ and forward to QA. They should be able to test Suite in its wholeness along with the new firmwares.
1. If QA gives a go-ahead we release. From suite point of view there is nothing else to do, it may be released as it is.
1. If we want to offer new releases to the users of 3rd-party applications (using connect popup) we need to publish `@trezor/connect-common` to npm registry and use new releases in `trezor-connect`.
	1. Update dependency of `trezor-connect`
	1. Follow instructions [how to deploy connect to production](https://github.com/trezor/connect/blob/83af30f73f4cfa7c099c55b2b0f8a103abc299c8/docs/deployment/index.md).

