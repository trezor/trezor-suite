# @trezor/suite-desktop e2e tests

**currently works only on Linux, volunteers to make it work on Mac needed**

### Prerequisites

```
yarn workspace @trezor/suite-desktop build:ui
yarn workspace @trezor/suite-desktop build:app:dev
```

Produces `build` and `dist` directories with javascript bundles in production mode and application assets.

_Note: This step needs to be repeated on each change._

### Running tests locally

`yarn workspace @trezor/suite-desktop-core test:e2e`

Opens an electron app controlled by the [playwright test runner](https://playwright.dev/)
