import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        files: [
            'src/generated/icons/**/*.{js,jsx,ts,tsx}',
            'icon-index-template.mjs',
            'svgr.native.config.mjs',
            'svgr.web.config.mjs',
        ],
        rules: {
            'import/no-default-export': 'off',
        },
    },
];
