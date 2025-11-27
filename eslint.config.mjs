// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { eslint, globalNoExtraneousDependenciesDevDependencies } from '@trezor/eslint';

export default [...eslint, {
    rules: {
        'import/no-extraneous-dependencies': [
            'error',
            {
                devDependencies: [
                    ...globalNoExtraneousDependenciesDevDependencies,
                    '**/connect-examples/**', // This must be here, connect-examples are not a package
                ],
            },
        ],
        'no-restricted-imports': [
            'error',
            {
                patterns: [
                    {
                        regex: '/libDev/src',
                        message: 'Importing from "*/libDev/src" path is not allowed.',
                    },
                ],
            },
        ],
    },
}, ...storybook.configs["flat/recommended"], ...storybook.configs["flat/recommended"]];
