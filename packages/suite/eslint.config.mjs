import { eslint } from '@trezor/eslint';

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
            'no-restricted-syntax': 'off', // Todo: this should be fixed in codebase and this line removed
            'import/no-default-export': 'off', // Todo: shall be solved one day, usually its legacy Components
            'no-console': 'off', // Todo: we use it a lot, shall be disabled more granulary I think
        },
    },
];
