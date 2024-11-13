import pluginCypress from 'eslint-plugin-cypress/flat';

import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    pluginCypress.configs.recommended,
    {
        rules: {
            'jest/valid-expect': 'off', // because of cypress tests
            'import/no-default-export': 'off', // Todo: fix and solve
            'no-console': 'off', // It's used in cypress tests
            'cypress/no-unnecessary-waiting': 'off', // A lot of arbitrary waiting is needed in Cypress tests
        },
    },
];
