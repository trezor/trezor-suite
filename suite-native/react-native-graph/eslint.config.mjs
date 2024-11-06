import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            'react/style-prop-object': 'off',
            '@typescript-eslint/no-use-before-define': 'off',
            'no-continue': 'off',
            'no-restricted-properties': 'off',
            '@typescript-eslint/no-shadow': 'off',
        },
    },
];
