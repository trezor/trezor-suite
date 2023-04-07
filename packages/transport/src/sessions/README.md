## Sessions

Sessions in @trezor/transport package is a mean to coordinate multiple applications accessing one device.

> Question: do we need to support this? 99% of users don't really use multiple tabs/wallets etc with one device.

> Answer: Yes.

### Problems

-   Device might change its state. We don't know until we ask.
-   Underlying data-transfer technology might not support simultaneous reads and writes by multiple clients.
-   We want to be 100% that the response we receive is really what we are expecting and not some stray response intended for someone else.

### Solution

-   Before client can access device it needs to `acquire` a `session`. Session is a simple integer that is incremented whenever a new session is granted.
-   Since we support not only multiple applications but also multiple devices, we keep session in a dict where key is `device.path`
-   If claimed session is correct, client is allowed to access device. Client sends its `session` with every `call` and transport validates that `session` is still valid.
-   Once client has finished its work with device, it is supposed to `release` its session. At this moment any other client is free to `acquire` session.

### Implementation

-   Since we not only support multiple devices and multiple applications but also different platforms things get little more complicated.
-   `BridgeTransport` has sessions management incorporated and is the "highest rank" transport. All applications should detect if it is available and if yes, `BridgeTransport` should be used.
-   Sessions management logic is contained in what we call [sessions background](packages/transport/src/sessions/background.ts) which is a simple typescript module that can be easily run in various contexts.
-   When `WebUSBTransport` is in use (browser environment), we strive for synchronization between tabs. We can achieve this by running `sessions background` in a [SharedWorker](https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker).
-   When experimental `NodeUSBTransport` is in use there is no synchronization **YET**. Technically, it should be possible to expose `sessions background` through a locally opened server. In that case we must ensure that browser applications connect to the right `sessions background`. Probably `sessions background` itself should check whether there is a `sessions background` of "higher rank" available and forward all requests to it.

### Next steps

-   Sessions negotiation and subordination
-   Sessions on protocol level.
