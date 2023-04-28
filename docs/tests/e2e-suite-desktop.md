# @trezor/suite-desktop e2e tests

### Prerequisites

```
yarn workspace @trezor/suite-desktop build:ui
yarn workspace @trezor/suite-desktop build:app
```

Produces `build` and `dist` directories with javascript bundles in production mode and application assets.

_Note: This step needs to be repeated on each change._

### Running tests locally

`yarn workspace @trezor/suite-desktop test:e2e`

Opens an electron app controlled by the [playwright test runner](https://playwright.dev/)
