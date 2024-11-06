import { eslint } from './src/index.mjs';

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
