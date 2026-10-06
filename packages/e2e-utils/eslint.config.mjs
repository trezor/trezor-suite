import { allowDevDependenciesIn, eslint } from '@trezor/eslint';

export default [
    ...eslint,
    // CI-only bots and scripts, never reachable from src/index, so they may use devDependencies.
    allowDevDependenciesIn([
        '**/llmExploratoryTester/**',
        '**/llmTestAnalyzer/**',
        '**/llmTestFixer/**',
        '**/llmTestSelector/**',
        '**/quarantineBot/**',
        '**/githubReporter/scriptCreateProject.ts',
        '**/githubReporter/watchdog/sandboxProject.ts',
    ]),
];
