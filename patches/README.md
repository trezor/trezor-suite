# Patches

## ripple-lib

## redux-thunk

## dropbox

patched incorrect types only

## app-builder-lib

Patch for app-builder-lib which is a package from [electron-builder](https://github.com/electron-userland/electron-builder)

The reason of this patch is to sign `.dll` binary files inside the directory `swiftshader` in the `.exe` for windows in order to satisfy AppLocker policy.

There is a [PR](https://github.com/electron-userland/electron-builder/pull/6682) to the upstream electron-builder that was merged and will be included in next release that will make this patch unnecessary.
