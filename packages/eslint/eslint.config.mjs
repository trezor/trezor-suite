import { eslint } from './src/index.mjs';

// This config is just for this package.
// The exported config, that shall be used in other packages, is in src/index.mjs.
export default [
    ...eslint,
    {
        files: ['**/*.mjs'], // disable for all other config-files in this package
        rules: {
            'import/no-default-export': 'off',
            'import/no-extraneous-dependencies': 'off',
        },
    },
];
