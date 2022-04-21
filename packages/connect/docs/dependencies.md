## Webpack:

Since `webpack@5` auto polyfills for `nodejs` are not provided.
see https://webpack.js.org/blog/2020-10-10-webpack-5-release/#automatic-nodejs-polyfills-removed

List of essential libraries to produce build:

-   `assert` (polyfill)
-   `crypto-browserify` (polyfill)
-   `css-loader`
-   `html-webpack-plugin`
-   `less`
-   `less-loader`
-   `less-plugin-*`
-   `mini-css-extract-plugin`
-   `process` (polyfill)
-   `stream-browserify` (polyfill)
-   `style-loader`
-   `terser-webpack-plugin`
-   `util` (polyfill)
-   `webpack-*`
-   `worker-loader`

## Extended dependencies:

`package.json` contains custom field called `extendedDependencies`.

Listed libraries are normally installed via `devDependencies` because in normal conditions they are used only to produce build hosted on `connect.trezor.io` (iframe/popup) and they should not a part of regular `npm` build.

Those dependencies are used in `npm-extended` package which contains whole business logic of trezor-connect.

## Frozen dependencies:

-   `cbor-web@7.0.6` - lib used by cardanoSignTransaction, version 8 requires node@14. This will be removed together with "legacy cardanoSignTransaction".

-   `flow-bin@0.130` - flow has too many breaking changes, it's worthless to implement them since TrezorConnect is going to be rewritten to typescript.

-   `node-fetch@2.6.3` - version 3 requires node@14.

-   `jest@26.6.3` + `eslint-plugin-jest` + `babel-jest` - jest 27 drops usage for node@12. https://github.com/facebook/jest/blob/main/CHANGELOG.md#2700 Tests detects opened handle at WebSocket which is used to communicate with trezor-user-env. WebSocket is a native nodejs `net.Socket` module. Further investigation needed. Probably the only solution to this and above issues will be update to node 14.

-   `@babel/node` - there is a problem with `core-js@3.18` on our gitlab CI.

```
Error: Cannot find module '../modules/es.symbol'
Require stack:
- ./node_modules/core-js/stable/index.js
- ./node_modules/@babel/node/lib/_babel-node.js
```

and those files (es.\*) are not present in runner ./node_modules/core-js/modules folder, they magically appears when running "yarn" directly in runner to. Investigate more...

-   `eslint-plugin-import` - there is a problem with on our gitlab CI.

```
Error: Failed to load plugin 'import' declared in '.eslintrc': Cannot find module '../5/CheckObjectCoercible'
```

similar case to @babel/node, may be related. Investigate more...
