/**
 * Stands in for a Node built-in the browser build leaves out, like `false` in webpack's `resolve.fallback`.
 * A file rather than a virtual module: Vite pre-bundles dependencies in a pass that runs no plugins,
 * so a virtual module required from inside a dependency could not be loaded there.
 */
export {};
