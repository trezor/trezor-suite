# Desktop Updates

The desktop build of Trezor Suite uses an auto-updating feature to keep the application up to date with our latest published release.

## Internals

The package `electron-updater` (part of `electron-builder`) is used to manage updates. Information about updates is displayed in our UI and the user can perform actions related to them (trigger update, skip, etc...).

In addition of what `electron-updater` provides us, we check signatures of downloaded files. For this to work, all files uploaded on Github need to have a signature attached with them. The signature will be checked against the SL signing key which is included in the application at build time. The key is located in `packages/suite-desktop-core/build/app-key.asc` and should be updated if the private key is changed.

## Development

### Running a custom update server locally

How to mock app update configuration locally for a development Suite Desktop build:

1. In any folder, run:

```bash
curl https://data.trezor.io/suite/releases/desktop/latest/latest.yml > latest.yml
curl https://data.trezor.io/suite/releases/desktop/latest/latest-mac.yml > latest-mac.yml
curl https://data.trezor.io/suite/releases/desktop/latest/latest-linux.yml > latest-linux.yml
```

2. Edit the files any way you want them.
   Note that `latest.yml` is for Windows.
3. _OPTIONAL:_ The `latest*.yml` files are enough to mock the "update available" flow, but if you want the update itself to proceed,
   there needs to be the production (codesign) installation file as per your platform + the corresponding `.asc` key. For example on Windows:

```bash
curl https://data.trezor.io/suite/releases/desktop/latest/Trezor-Suite-26.7.2-win-x64.exe > Trezor-Suite-26.7.2-win-x64.exe
curl https://data.trezor.io/suite/releases/desktop/latest/Trezor-Suite-26.7.2-win-x64.exe.asc > Trezor-Suite-26.7.2-win-x64.exe.asc
```

4. Run the local server:

```bash
npm i -g http-server
http-server -p 8989
```

5. Run Suite in terminal with flag `--updater-url=http://localhost:8989`

### Notes

Please be aware that it is not allowed to update to a dev (non-codesign) installation file, even from a dev installation!
Signature verification is a hard requirement for Desktop Update because of its autonomous nature, so reinstalling to a dev installation
has to be installed manually.

But it is possible vice versa: a dev installation can be autoupdated to production.
