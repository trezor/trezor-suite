# @trezor/connect-popup

Build `@trezor/connect` popup hosted on `connect.trezor.io/*/popup.html`

### Build

`yarn workspace @trezor/connect-popup build`

### Develop

`yarn workspace @trezor/connect-popup dev`

Example how to change src/index `onLoad` function to display view you are working on:

```
const onLoad = () => {
    showView('pin');
};
```
