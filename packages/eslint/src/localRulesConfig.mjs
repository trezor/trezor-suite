import pluginLocalRules from 'eslint-plugin-local-rules';
/**
 * @typedef {import('eslint').Linter.Config} Config
 */

/** @type {Config[]} */
export default [
    {
        plugins: {
            'local-rules': pluginLocalRules,
        },
        rules: {
            'local-rules/no-override-ds-component': [
                'error',
                { packageNames: ['@trezor/components', '@trezor/product-components'] },
            ],
            'local-rules/no-classname-on-component': 'error',
        },
    },

    {
        files: ['packages/connect-explorer-theme/**/*'],
        rules: {
            'local-rules/no-classname-on-component': 'off',
            'local-rules/no-override-ds-component': 'off',
        },
    },
];
