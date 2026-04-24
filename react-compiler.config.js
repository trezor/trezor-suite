// Shared React Compiler plugin config for all babel-based build pipelines.
// See plans/react-compiler-migration.md for rollout phasing.
//
// A file is compiled iff its resolved path contains ANY fragment from ENABLED_PATHS
// AND NONE of the fragments from EXCLUDED_PATHS.

const ENABLED_PATHS = ['packages/product-components/', 'packages/components/', 'packages/suite/'];

const EXCLUDED_PATHS = [
    // React Hook Form's deep form hook chain (compose/fees/RBF/send) breaks when compiled;
    // effect dep tracking misses re-composes. Convert to per-file `"use no memo"` as a follow-up.
    // See plans/react-compiler-follow-ups.md.
    'packages/suite/src/hooks/wallet/',
];

const reactCompilerSources = filename => {
    if (!filename) return false;
    const normalized = filename.replace(/\\/g, '/');
    if (EXCLUDED_PATHS.some(fragment => normalized.includes(fragment))) return false;

    return ENABLED_PATHS.some(fragment => normalized.includes(fragment));
};

// Babel override that scopes the compiler plugin to matching files. The plugin throws a config
// error on files with a null filename (virtual modules, raw-loader output), so we cannot rely on
// its own `sources` option to gate it — the null check in the plugin runs before that filter.
// Using `overrides` keeps the plugin out of the babel chain for non-matching files entirely.
const reactCompilerBabelOverride = {
    test: reactCompilerSources,
    plugins: [['babel-plugin-react-compiler', {}]],
};

module.exports = {
    ENABLED_PATHS,
    EXCLUDED_PATHS,
    reactCompilerSources,
    reactCompilerBabelOverride,
};
