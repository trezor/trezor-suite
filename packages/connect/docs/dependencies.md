## Webpack:

Since `webpack@5` auto polyfills for `nodejs` are not provided.
see https://webpack.js.org/blog/2020-10-10-webpack-5-release/#automatic-nodejs-polyfills-removed

List of essential libraries to produce build:

-   `assert` (polyfill)
-   `crypto-browserify` (polyfill)
-   `html-webpack-plugin`
-   `process` (polyfill)
-   `stream-browserify` (polyfill)
-   `style-loader`
-   `terser-webpack-plugin`
-   `util` (polyfill)
-   `webpack-*`
-   `worker-loader`

## Frozen dependencies:

-   `cbor-web@7.0.6` - lib used by cardanoSignTransaction, version 8 requires node@14. This will be removed together with "legacy cardanoSignTransaction".

-   `node-fetch@2.6.3` - version 3 requires node@14.

<!-- REF-TODO: monorepo has its own version of jest -->
<!-- -   `jest@26.6.3` + `eslint-plugin-jest` + `babel-jest` - jest 27 drops usage for node@12. https://github.com/facebook/jest/blob/main/CHANGELOG.md#2700 Tests detects opened handle at WebSocket which is used to communicate with trezor-user-env. WebSocket is a native nodejs `net.Socket` module. Further investigation needed. Probably the only solution to this and above issues will be update to node 14. -->

```
Error: Cannot find module '../modules/es.symbol'
Require stack:
- ./node_modules/core-js/stable/index.js
- ./node_modules/@babel/node/lib/_babel-node.js
```

and those files (es.\*) are not present in runner ./node_modules/core-js/modules folder, they magically appears when running "yarn" directly in runner to. Investigate more...
