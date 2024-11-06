import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            'import/no-extraneous-dependencies': [
                'error',
                {
                    includeTypes: true,
                },
            ],
        },
    },
];
