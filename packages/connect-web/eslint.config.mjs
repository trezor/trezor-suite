import {
    allowDevDependenciesIn,
    allowTypeOnlyDevDependenciesIn,
    eslint,
    playwrightEslint,
} from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            'no-underscore-dangle': 'off', // underscore is used
            camelcase: 'off', // camelcase is used
            'jest/valid-expect': 'off', // because of playwright tests
            'import/no-default-export': 'off', // Todo: shall be fixed
        },
    },
    playwrightEslint,
    allowDevDependenciesIn(['**/webpack/**']),
    // See the note in @trezor/connect-common: Connect's published closure stays small.
    allowTypeOnlyDevDependenciesIn(['**/src/**']),
];
