# Versioning

We are using so-called [calendar versioning](https://calver.org/) in the format `YY.MM.PATCH`.

- `YY` stands for the current year.
- `MM` stands for the current month.
- `PATCH` is increased on every release in the given month.

#### Examples

- `20.10.1` first release in Oct 2020
- `20.10.3` third release in Oct 2020
- `19.12.1` first release in Dec 2019

## Beta versions

We version _beta_ in a similar way as production versions but we always set `PATCH` to 0 and increase the `MM`.

That means that every release on beta has 0 as the patch version. This has a drawback that you can't distinguish beta deployments by a version number, but beta testers should be able to read and report the commit hash.

Only stable releases have patch version >1 and this increases with each stable release: 1, 2, 3, 4.

Beta also has +1 `MM` version when compared to stable indicating this is upcoming release which will be deployed on stable next month.

#### Examples
- `20.10.1` first release on Oct 15th to stable
- `20.10.2` second release on Oct 22nd to stable
- `20.11.0` release on Oct 29th 2020 to beta
- `20.11.0` another release on Nov 5th to beta
- `20.11.1` public release on Nov 14th to stable

## Develop versioning

We use the same scheme as beta. That is, `develop` branch has always `YY.MM.0` version where `MM` is the upcoming month's release.
When we fork `develop` to `release/20YY-MM` branch, we bump the release branch version to `YY.MM.1` and
increase the `develop` version to `YY.(MM+1).0` indicating we are already brewing next release in the `develop`.
