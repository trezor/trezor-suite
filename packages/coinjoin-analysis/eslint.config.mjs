import { eslint } from '@trezor/eslint';

export default [
    ...eslint,
    {
        rules: {
            // The port mirrors upstream C# statement for statement, including the mutation
            // of a shared per-address anonymity map that the fold depends on.
            'no-plusplus': 'off',
            'no-param-reassign': 'off',
            '@typescript-eslint/no-shadow': 'off',

            // `src/blockchainAnalyzer.ts` is a port of a single C# class, and its member
            // order is load-bearing for anyone reviewing it against
            // `Blockchain/Analysis/BlockchainAnalyzer.cs`: `Analyze` dispatches first, then
            // each branch, then the shared helpers. Satisfying this rule would mean
            // inverting that order, turning a file a reviewer can read alongside the
            // original into one they cannot. The arrow functions are all module-level
            // `const`s, so nothing is actually reachable before initialization.
            '@typescript-eslint/no-use-before-define': 'off',
        },
    },
];
