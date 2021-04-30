# Adding New Firmwares

In case we are about to release both Suite and firmwares we want to add the signed firmwares during the Freeze so QA has the whole thing to test.

## Add firmwares

1. Complete the firmware release process including firmware signing.
2. Add firmwares to [webwallet-data](https://github.com/trezor/webwallet-data/) and modify its `releases.json` file. See e.g. [a1831647](https://github.com/trezor/webwallet-data/commit/f8ed15a8999689e7692b8fc4c00b7aaef25d8011) for an example.
3. Deploy them to data.trezor.io. _This is currently done manually and should be automated._
4. Modify `releases.json` in Connect. See [5350f7ee](https://github.com/trezor/connect/commit/5350f7eef30a2137127636e8d8c42238ddc0d14c) for example.

## Publish Connect to NPM and bump in Suite

5. Publish Connect as beta. See [Connect: Updating NPM to beta](https://github.com/trezor/connect/blob/db7139e2cd22dd0d9ea9dc3f0725dbd13a57f691/docs/deployment/index.md#beta) on how to do that.
6. Bump Connect in Suite. See [connect/bump.md](../packages/connect/bump.md).

## Freeze & Release

7. Freeze Suite. At this moment you are all good to _Freeze_ and forward to QA. They should be able to test Suite in its wholeness along with the new firmwares. [1]
8. If QA gives a go-ahead we release.
9. Publish Connect to production.
	1. To connect.trezor.io, see [Connect: Updating NPM to production](https://github.com/trezor/connect/blob/db7139e2cd22dd0d9ea9dc3f0725dbd13a57f691/docs/deployment/index.md#production).
	2. To NPM, see [this](https://github.com/trezor/connect/blob/db7139e2cd22dd0d9ea9dc3f0725dbd13a57f691/docs/deployment/index.md#production).

[1] Note that at this moment you have a `-beta` version of Connect bundled in Suite. This however does not pose any problem. We simply release Suite with this `-beta` version and publish Connect production version later.
