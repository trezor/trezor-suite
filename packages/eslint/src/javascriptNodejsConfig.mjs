export const javascriptNodejsConfig = [
    {
        // These rules are specific to JavaScript running on Node.js.
        rules: {
            // Additional
            'handle-callback-err': 'error', // enforces error handling in callbacks (off by default) (on by default in the node environment)
            'no-mixed-requires': 'error', // disallow mixing regular variable and require declarations (off by default) (on by default in the node environment)
            'no-new-require': 'error', // disallow use of new operator with the require function (off by default) (on by default in the node environment)
            'no-path-concat': 'error', // disallow string concatenation with __dirname and __filename (off by default) (on by default in the node environment)
            'no-restricted-modules': 'error', // restrict usage of specified node modules (off by default)
            'eol-last': 'error',

            // Offs
            'no-sync': 'off', // disallow use of synchronous methods (off by default)
            'no-process-exit': 'off', // disallow process.exit() (on by default in the node environment)
        },
    },
];
