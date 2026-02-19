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
    {
        files: [
            'suite/**/*.{js,mjs,cjs,ts,jsx,tsx}',
            'suite-native/**/*.{js,mjs,cjs,ts,jsx,tsx}',
            'suite-common/**/*.{js,mjs,cjs,ts,jsx,tsx}',
        ],
        rules: {
            'local-rules/no-package-deep-imports': [
                'error',
                { packageScopes: ['@suite-native', '@suite', '@suite-common', '@trezor'] },
            ],
        },
    },
];
