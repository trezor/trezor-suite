import { eslint, globalNoExtraneousDependenciesDevDependencies } from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            'import/no-extraneous-dependencies': [
                'error',
                {
                    devDependencies: [
                        ...globalNoExtraneousDependenciesDevDependencies,
                        '**/connect-examples/**', // This must be here, connect-examples are not a package
                        '**/eslint-local-rules/**', // Uses ts-node at runtime when loaded by ESLint
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
    },
    {
        // TARGET: Storybook files anywhere in the project
        files: ['**/*.stories.@(ts|tsx|js|jsx)'],
        rules: {
            'import/no-default-export': 'off', // Storybook stories need default exports by design.
            'react-hooks/rules-of-hooks': 'off', // It is possible to use hooks in Storybook stories outside of the component (e.g in the render method).
        },
    },
];
