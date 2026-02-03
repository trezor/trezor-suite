# @suite-common/sentry

This is a package for code that's common for all Sentry integration in Suite applications.

Sentry in Trezor Suite is split into two projects (which have their own config),<br />
and four separate runtimes (each has its own SDK initialization):

- project `trezor-suite`, with common config in `@suite/sentry`
    - browser runtime (Suite Web, in `@packages/suite-web`)
    - electron-renderer runtime (Suite Desktop, in `@packages/suite-desktop-ui`)
    - electron-main runtime (Suite Desktop, in `@packages/suite-desktop-core`)
- project `suite-native`
    - react-native runtime (Suite Mobile, in `@suite-native/sentry`)
