import pluginLocalRules from 'eslint-plugin-local-rules';
/**
 * @typedef {import('eslint').Linter.Config} Config
 */

// These packages, since they are publishable are exporting minimal stuff that is needed for 3rd parties and we don't want to bloat the index.ts
// Instead of that, we're going to ignore the deep-import rule for these packages.
const publishableTrezorPackages = [
    '@trezor/blockchain-link',
    '@trezor/blockchain-link-blockbook',
    '@trezor/blockchain-link-blockfrost',
    '@trezor/blockchain-link-electrum',
    '@trezor/blockchain-link-evm-rpc',
    '@trezor/blockchain-link-ripple',
    '@trezor/blockchain-link-solana',
    '@trezor/blockchain-link-stellar',
    '@trezor/blockchain-link-utils',
    '@trezor/connect',
    '@trezor/connect-common',
    '@trezor/connect-data',
    '@trezor/connect-mobile',
    '@trezor/connect-plugin-ethereum',
    '@trezor/connect-plugin-stellar',
    '@trezor/connect-web',
    '@trezor/connect-webextension',
    '@trezor/crypto-utils',
    '@trezor/device-authenticity',
    '@trezor/device-utils',
    '@trezor/env-utils',
    '@trezor/protobuf',
    '@trezor/protocol',
    '@trezor/schema-utils',
    '@trezor/transport',
    '@trezor/type-utils',
    '@trezor/utils',
    '@trezor/utxo-lib',
    '@trezor/websocket-client',
];

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
                {
                    packageScopes: ['@suite-native', '@suite', '@suite-common', '@trezor'],
                    ignoredPackages: publishableTrezorPackages,
                },
            ],
            'local-rules/analytics-event-name': 'error',
        },
    },
    {
        files: ['suite-common/**/*.{js,mjs,cjs,ts,jsx,tsx}'],
        rules: {
            'local-rules/no-suite-imports-in-suite-common': 'error',
        },
    },
];
