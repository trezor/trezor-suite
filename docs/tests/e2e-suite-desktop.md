# @trezor/suite-desktop e2e tests

### Prerequisites

1. `yarn workspace @trezor/suite-desktop build:ui`

    Produces `suite-desktop/build` directory with javascript bundles in production mode.

    _Note: This step needs to be repeated on each change in suite-desktop-ui package._

2. `yarn workspace @trezor/suite-desktop build:app`

    Produces `suite-desktop/dist` directory with javascript bundles in production mode and application assets.

    _Note: This step needs to be repeated on each change in suite-desktop-core package._

3. `cd path/to/trezor-user-env && ./run.sh`

    To run the `trezor-user-env` that Playwright tests needs.

### Running tests locally

`yarn workspace @trezor/suite-desktop-core test:e2e`

Opens an electron app controlled by the [playwright test runner](https://playwright.dev/)

1. **To run just one test** you can do: `yarn workspace @trezor/suite-desktop-core test:e2e general/wallet-discovery.test.ts`

2. **To debug test** add `await window.pause();` to place where you want test to stop. Debugger window will open.

3. **To enable Debug Tools in the browser** press `Ctrl+Shift+I`
