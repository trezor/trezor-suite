import pluginLocalRules from 'eslint-plugin-local-rules';
/**
 * @typedef {import('eslint').Linter.Config} Config
 */

/** @type {Config[]} */
export const localRulesConfig = [
    {
        plugins: {
            'local-rules': pluginLocalRules,
        },
        rules: {
            'local-rules/no-override-ds-component': [
                'error',
                { packageNames: ['@trezor/components', '@trezor/product-components'] },
            ],
        },
    },
];
