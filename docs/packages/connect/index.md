# Trezor Connect

## Installation

### Node.js

Install library as npm module:

```javascript
npm install @trezor/connect
```

or

```javascript
yarn add @trezor/connect
```

ES6

```javascript
import TrezorConnect from '@trezor/connect';
```

### Web based environments

Install library as npm module:

```javascript
npm install @trezor/connect-web
```

or

```javascript
yarn add @trezor/connect-web
```

Or include library as inline script:

```javascript
<script src="https://connect.trezor.io/9/trezor-connect.js"></script>
```

ES6

```javascript
import TrezorConnect from '@trezor/connect-web';
```

Inline

```javascript
var TrezorConnect = window.TrezorConnect;
```

## How to use

Initialize in project

```javascript
TrezorConnect.init({
    lazyLoad: true, // this param will prevent iframe injection until TrezorConnect.method will be called
    manifest: {
        email: 'developer@xyz.com',
        appUrl: 'http://your.application.com',
    },
});
```

Trezor Connect Manifest requires that you, as a Trezor Connect integrator, share your e-mail and application url with us.
This provides us with the **ability to reach you in case of any required maintenance.**
This subscription is mandatory. Trezor Connect raises an error that reads "Manifest not set" if manifest is not provided. It can be either set via `manifest` method or passed as a param in `init` method.

```javascript
TrezorConnect.manifest({
    email: 'developer@xyz.com',
    appUrl: 'http://your.application.com',
});
```

If you need more customization, refer to [init method documentation](./methods/init.md)

## API methods

-   [List of methods](methods.md)

## Handling events

-   [Events](events.md)

## How it works in browser based environments

After implementing Trezor Connect, a small file containing a declaration
of methods is downloaded. Once the Trezor Connect [method](methods.md) is used,
the connection to the trezor.io external webpage is established and the
Trezor Connect library is going to be downloaded and injected as an
invisible iframe into your application. Trezor Connect is open source,
therefore it is provable that it is not saving any
information about the device or account. Trezor Bridge has whitelisted
domains set to "\*.trezor.io" and "localhost" and it is ignoring
messages coming from other domains. This ensures that Connect is not
providing any data without the user's consent. Trezor Connect works as a
tunnel for messages sent from your application to Trezor device via
transport layer (Trezor Bridge/WebUSB).

![](connect_flowchart.png)

**Note** With the newest Trezor Connect API, the iframe element ensures that the communication after authentification with PIN and/or Passphrase persists until

-   application is closed or reloaded
-   device is unplugged or used in another application
-   ten minutes of being idle

The advantages are that the session carries on, it is not necessary to re-enter your PIN and/or Passphrase and, furthermore, it is sending events to application when the device is connected, disconnected or used in another window (application). This feature makes it easier to use the Trezor device with applications.
