import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            'no-underscore-dangle': 'off', // underscore is used
            camelcase: 'off', // camelcase is used
            'jest/valid-expect': 'off', // because of cypress tests
            'import/no-default-export': 'off', // Todo: shall be fixed
        },
    },
];
