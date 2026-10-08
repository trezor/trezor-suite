import {
    allowDevDependenciesIn,
    eslint,
    noNetworkTypeBranchingSyntax,
    noRestrictedSyntax,
} from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            'react/style-prop-object': [
                'error',
                {
                    allow: ['FormattedNumber'],
                },
            ],
            'import/no-default-export': 'off', // Todo: shall be solved one day, usually its legacy Components
            'no-console': 'off', // Todo: we use it a lot, shall be disabled more granulary I think
            '@typescript-eslint/no-shadow': 'off', // Todo: shall be fixed
        },
    },
    allowDevDependenciesIn(['**/src/support/tests/**', '**/src/support/test-utils/**']),
    {
        // Views built on chain networks; the network decides family behaviour.
        files: [
            'src/hooks/wallet/chainData/**/*.{ts,tsx}',
            'src/hooks/wallet/chainSend/**/*.{ts,tsx}',
            'src/support/chainSend/**/*.{ts,tsx}',
        ],
        rules: {
            'no-restricted-syntax': [
                'error',
                ...noRestrictedSyntax,
                ...noNetworkTypeBranchingSyntax,
            ],
        },
    },
];
