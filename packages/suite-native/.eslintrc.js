module.exports = {
    rules: {
        // Variables
        // These rules have to do with variable declarations.
        'no-catch-shadow': 1, // disallow the catch clause parameter name being the same as a variable in the outer scope (off by default in the node environment)
        'no-label-var': 2, // disallow labels that share a name with a variable
        'no-shadow': 2, // disallow declaration of variables already declared in the outer scope
        'no-shadow-restricted-names': 2, // disallow shadowing of names such as arguments
        'no-undef': 2, // disallow use of undeclared variables unless mentioned in a /*global */ block
        'no-undefined': 0, // disallow use of undefined variable (off by default)
        'no-undef-init': 2, // disallow use of undefined when initializing variables
        'no-unused-vars': [2, { vars: 'all', args: 'none', ignoreRestSiblings: true }], // disallow declaration of variables that are not used in the code
        'no-use-before-define': 2, // disallow use of variables before they are defined

        // Node.js
        // These rules are specific to JavaScript running on Node.js.
        'handle-callback-err': 2, // enforces error handling in callbacks (off by default) (on by default in the node environment)
        'no-mixed-requires': 2, // disallow mixing regular variable and require declarations (off by default) (on by default in the node environment)
        'no-new-require': 2, // disallow use of new operator with the require function (off by default) (on by default in the node environment)
        'no-path-concat': 2, // disallow string concatenation with __dirname and __filename (off by default) (on by default in the node environment)
        'no-process-exit': 0, // disallow process.exit() (on by default in the node environment)
        'no-restricted-modules': 2, // restrict usage of specified node modules (off by default)
        'no-sync': 0, // disallow use of synchronous methods (off by default)

        // React-Hooks Plugin
        // The following rules are made available via `eslint-plugin-react-hooks`
        'react-hooks/rules-of-hooks': 2,
        'react-hooks/exhaustive-deps': 2,
        'eol-last': 2,

        // Code style
        'import/order': [
            'error',
            {
                groups: ['builtin', 'external', 'internal'],
                pathGroups: [
                    {
                        pattern: 'react?(-native)',
                        group: 'external',
                        position: 'before',
                    },
                    {
                        pattern: '@trezor/.*',
                        group: 'external',
                        position: 'before',
                    },
                ],
                pathGroupsExcludedImportTypes: ['react', '@trezor.*'],
                'newlines-between': 'always',
                alphabetize: {
                    order: 'asc',
                    caseInsensitive: true,
                },
            },
        ],
        'sort-imports': 0, // disabled import/order rule in favor of import/order rule
        'no-nested-ternary': 2, // disallow nested ternary expressions

        // Dependencies
        'import/no-extraneous-dependencies': 2, // all dependencies must be in corresponding package.json
    },
};
