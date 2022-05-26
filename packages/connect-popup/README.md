# @trezor/connect-popup

Build `@trezor/connect` popup, which serves as a UI for communication with Trezor device via [@trezor/connect](../connect). UI shows a loading screen until a communication channel between popup and [@trezor/connect-iframe](../connect-iframe) is established.

Official versions of the app are hosted on `connect.trezor.io/<version>/popup.html`

## Build

`yarn workspace @trezor/connect-popup build`

## Develop

`yarn workspace @trezor/connect-popup dev`

Open http://localhost:8088/popup.html.

Example how to change src/index `onLoad` function to display view you are working on:

```
const onLoad = () => {
    showView('pin');
};
```
