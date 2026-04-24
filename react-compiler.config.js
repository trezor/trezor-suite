// Shared React Compiler plugin config for all babel-based build pipelines.
// See plans/react-compiler-migration.md for rollout phasing.
//
// To expand compiler scope, add path fragments to ENABLED_PATHS below.
// A file is compiled iff its resolved path contains ANY of the fragments.

const ENABLED_PATHS = ['packages/product-components/', 'packages/components/'];

const reactCompilerSources = filename => {
    if (!filename) return false;
    const normalized = filename.replace(/\\/g, '/');

    return ENABLED_PATHS.some(fragment => normalized.includes(fragment));
};

const reactCompilerPlugin = ['babel-plugin-react-compiler', { sources: reactCompilerSources }];

module.exports = {
    ENABLED_PATHS,
    reactCompilerPlugin,
    reactCompilerSources,
};
