import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        files: ['icon-index-template.mjs', 'svgr.web.config.mjs'],
        rules: {
            'import/no-default-export': 'off',
        },
    },
];
