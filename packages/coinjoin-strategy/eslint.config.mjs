import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            // The port mirrors upstream C# statement for statement, including loop and
            // mutation style that reads oddly in TypeScript but keeps the draw order
            // and the arithmetic quirks visible next to the original.
            'no-plusplus': 'off',
            'no-continue': 'off',
            'no-labels': 'off',
            '@typescript-eslint/no-shadow': 'off',
        },
    },
];
