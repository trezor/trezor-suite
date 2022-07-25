# @suite-common/test-utils

This package defines global mocks for Dropbox, TrezorConnect, etc. to be shared between more packages that use these mocks in their tests.

## Usage and configuration

1. add `@suite-common/test-utils` to a project dependencies
2. set up it in the project's Jest configuration file:

```javascript
// jest.config.js
import `const setupFiles = require('@suite-common/test-utils/src/setupFiles');`

...
...

module.exports = {
    ...,
    setupFiles
}
```

3. Create a type definition file (e.g. `mockGlobalTypes.d.ts`) and import the package:

```javascript
import '@suite-common/test-utils';
```

See the package `@suite-common/wallet-utils` for an example configuration.
