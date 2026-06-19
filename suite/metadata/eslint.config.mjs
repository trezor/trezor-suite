import { eslint, noCastedObjectHelpersSyntax } from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            'no-console': 'off',
            '@typescript-eslint/no-shadow': 'off', // Todo: shall be fixed
            // keep the casted-Object-helper ban active; the rest of no-restricted-syntax stays off (legacy getState/state-as-any debt)
            'no-restricted-syntax': ['error', ...noCastedObjectHelpersSyntax],
            'import/no-default-export': 'off', // Todo: shall be solved one day, usually its legacy Components
        },
    },
];
