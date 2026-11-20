import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        ignores: ['**/.build-storybook/*', '**/.rnstorybook/storybook.requires.ts'], // auto generated files
    },
    {
        rules: { 'import/no-default-export': 'off' }, // Storybook rely on default exports
    },
];
