import { eslint, globalNoExtraneousDependenciesDevDependencies } from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            'import/no-extraneous-dependencies': [
                'error',
                {
                    // CI-only bots and scripts, never reachable from src/index, so they may use devDependencies.
                    devDependencies: [
                        ...globalNoExtraneousDependenciesDevDependencies,
                        '**/fixBot/**',
                        '**/llmExploratoryTester/**',
                        '**/llmTestAnalyzer/**',
                        '**/llmTestSelector/**',
                        '**/quarantineBot/**',
                        '**/githubReporter/scriptCreateProject.ts',
                        '**/githubReporter/watchdog/sandboxProject.ts',
                    ],
                    includeTypes: true,
                },
            ],
        },
    },
];
