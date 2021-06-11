# Versioning

This repo contains a mix of packages with 3 different versioning schemes and schedules.

## Private Packages

That is, all packages that have `private: true` in their `package.json` and are not consumed by third parties nor published to NPM. Because they get only consumed by other packages in this repo (eg. `@trezor/suite-data` or `@trezor/suite`) by the Yarn's [workspace resolution](https://classic.yarnpkg.com/en/docs/workspaces/) or are distributed in other forms like, for example, bundled applications (eg. `@trezor/suite-desktop`) or websites (eg. `@trezor/suite-web-landing`) we do not version them. That is, their version is kept at `1.0.0` all the time.

## Public Packages

That is, packages published to NPM consumed by third parties. At the moment of writing this there are 2 public packages: `rollout` and `blockchain-link`. They follow the [SemVer scheme](https://semver.org/) on irregular schedule.

## Suite App

The version of the Suite App itself is tracked in the `suiteVersion` field of the suite `package.json`. This version is a way to communicate the steps in evolution of the Suite app between our product, marketing, support teams and the users.

We are using so-called [calendar versioning](https://calver.org/) in the format `YY.MM.PATCH` where
- `YY` stands for the current year.
- `MM` stands for the current month.
- `PATCH` is increased on every release in the given month.

For example:
- `20.10.1` first release in Oct 2020
- `20.10.3` third release in Oct 2020
- `19.12.1` first release in Dec 2019

### Beta versions

We version _beta_ in a similar way as production versions but we always set `PATCH` to 0 and increase the `MM`.

That means that every release on beta has 0 as the patch version. This has a drawback that you can't distinguish beta deployments by a version number, but beta testers should be able to read and report the commit hash.

Only stable releases have patch version >1 and this increases with each stable release: 1, 2, 3, 4.

Beta also has +1 `MM` version when compared to stable indicating this is upcoming release which will be deployed on stable next month.

For example:
- `20.10.1` first release on Oct 15th to stable
- `20.10.2` second release on Oct 22nd to stable
- `20.11.0` release on Oct 29th 2020 to beta
- `20.11.0` another release on Nov 5th to beta
- `20.11.1` public release on Nov 14th to stable

### Development versions

We use the same scheme as beta. That is, `develop` branch has always `YY.MM.0` version where `MM` is the upcoming month's release.
When we fork `develop` to `release/20YY-MM` branch, we bump the release branch version to `YY.MM.1` and
increase the `develop` version to `YY.(MM+1).0` indicating we are already brewing next release in the `develop`.
