# @suite-common/sentry

This is a package for code that's common for Sentry integration in Suite applications.

Also contains static config for individual Suite applications, but there mustn't be any runtime setup of Sentry.
That must be kept in the individual applications or their respective packages.

Sentry is then initialized in 4 separate runtimes:

- browser (Suite Web, in `@packages/suite-web`)
- electron-renderer (Suite Desktop, in `@packages/suite-desktop-ui`)
- electron-main (Suite Desktop, in `@packages/suite-desktop-core`)
- react-native (Suite Mobile, in `@suite-native/sentry`)
