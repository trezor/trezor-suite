# @trezor/suite-web

Build target for web environment.

## Development

```
yarn workspace @trezor/suite-web dev
```

## Bundle analysis

Visualize size of output files with [Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)

```
yarn workspace @trezor/suite-web analyze
```

## Preview

Start local server with production build and applied security headers:

```
yarn workspace @trezor/suite-web preview
```

## Build & Preview

Build web app and run the preview command:

```
yarn workspace @trezor/suite-web build:preview
```
