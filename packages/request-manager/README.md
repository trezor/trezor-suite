# Request manager

Library to allow efficient and stable proxy for requests using Tor or other similar systems.
For now it works specifically with Tor, but it may be more generic in future and integrate with other similar proxy systems like Tor.

## Examples

```typescript
import { TorController } from '@trezor/request-manager';

const host = 'localhost';
const port = 9030;
const controlPort = 9031;
// If the 'CookieAuthentication' option is true, Tor writes a "magic
// cookie" file named "control_auth_cookie" into its data directory (or
// to another file specified in the 'CookieAuthFile' option).
// https://gitweb.torproject.org/torspec.git/tree/control-spec.txt
const authFilePath = '/path/to/control_auth_cookie/';

const torController = new TorController({
    host: torHost,
    port: port,
    controlPort: controlPort,
    authFilePath: authFilePath,
});

try {
    await torController.waitUntilAlive();
    // Start using proxy.
} catch (error) {
    // Connection not possible, handle it.
}
```

## Tests

To run the tests use the command below:

```bash
yarn test:unit
```

## Build

To build the library run the command below:

```bash
yarn build:lib
```
