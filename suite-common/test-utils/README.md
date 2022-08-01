# @suite-common/test-utils

This package defines mocks for TrezorConnect to be shared between more packages that use these mocks in their tests.

## Usage and configuration

1. add `@suite-common/test-utils` to a project dependencies
2. import mocks in your tests or fixtures

```javascript
import { testMocks } from '@suite-common/test-utils';
```

3. use it

```javascript
jestMocks.getWalletAccount({
    deviceState: '7dcccffe70d8bb8bb28a2185daac8e05639490eee913b326097ae1d73abc8b4f',
    descriptor:
        'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
    symbol: 'btc',
});
```

See the package `@suite-common/wallet-utils` and its tests for an example configuration.
