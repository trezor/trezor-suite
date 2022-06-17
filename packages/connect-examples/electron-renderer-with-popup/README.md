# Electron renderer process with popup (default)

`@trezor/connect` files are hosted on `connect.trezor.io` domain and rendered inside `popup` (new window) element.

This application can be also developed and published in browser since it doesn't require any electron specific behavior and it will act in the same way in both environments.

Note that @trezor/connect is included in index.html script tag

```
    <script type="text/javascript" src="https://connect.trezor.io/9/trezor-connect.js"></script>
```

## Install

`yarn`

## Develop

`yarn dev`

## Build

`yarn build:mac`

`yarn build:linux`

`yarn build:win`
