import { eslint } from '@trezor/eslint';

export default [
    {
        ignores: ['src/generated/icons/**'],
    },
    ...eslint,
    {
        files: ['icon-index-template.mjs', 'svgr.web.config.mjs'],
        rules: {
            'import/no-default-export': 'off',
        },
    },
];
