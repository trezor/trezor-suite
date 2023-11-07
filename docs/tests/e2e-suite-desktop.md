# @trezor/suite-desktop e2e tests

### Prerequisites

```
yarn workspace @trezor/suite-desktop build:ui
```

Produces `suite-desktop/build` directory with javascript bundles in production mode.

_Note: This step needs to be repeated on each change in suite-desktop-ui package._

```
yarn workspace @trezor/suite-desktop build:app
```

Produces `suite-desktop/dist` directory with javascript bundles in production mode and application assets.

_Note: This step needs to be repeated on each change in suite-desktop-core package._

### Running tests locally

`yarn workspace @trezor/suite-desktop-core test:e2e`

Opens an electron app controlled by the [playwright test runner](https://playwright.dev/)
