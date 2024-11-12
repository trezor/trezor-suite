import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        ignores: [
            // This is a JS only codebase written in JS, so we are not checking it
            // Todo: reconsider this decision as most of the ESLint issues are auto-fixable
            'src/**/*.js',
            'tests/**/*.js',
        ],
    },
];
