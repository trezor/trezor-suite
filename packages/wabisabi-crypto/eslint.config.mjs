import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            // The port mirrors upstream C# expression-for-expression; bitwise arithmetic,
            // underscore-prefixed private fields and single-letter protocol names are intrinsic to it.
            'no-bitwise': 'off',
            'no-underscore-dangle': 'off',
            'no-plusplus': 'off',
            '@typescript-eslint/no-shadow': 'off',
        },
    },
];
