import pluginJs from '@eslint/js';
/**
 * @typedef {import('eslint').Linter.Config} Config
 */

/** @type {Config[]} */
export const javascriptConfig = [
    pluginJs.configs.recommended,
    {
        rules: {
            // Additional rules
            'no-console': ['error', { allow: ['warn', 'error'] }],
            'arrow-body-style': ['error', 'as-needed'],
            'require-await': ['error'],
            'no-nested-ternary': 'error',
            'prefer-destructuring': [
                'error',
                {
                    VariableDeclarator: {
                        array: false,
                        object: true,
                    },
                    AssignmentExpression: {
                        array: false,
                        object: false,
                    },
                },
                {
                    enforceForRenamedProperties: false,
                },
            ],
            'no-label-var': 'error', // Disallow labels that share a name with a variable
            'no-undef-init': 'error', // Disallow initializing variables to undefined
            'no-restricted-syntax': [
                'error',
                {
                    message:
                        "Please don't use createAsyncThunk. Use createThunk from @suite-common/redux-utils instead.",
                    selector: "CallExpression[callee.name='createAsyncThunk']",
                },
                {
                    message:
                        'Please don\'t use getState directly. Always use strongly typed selector, because geState is typed as "any" and it\'s dangerous to use it directly.',
                    selector:
                        'MemberExpression[property.type="Identifier"]:matches([object.callee.name="getState"])',
                },
                {
                    message:
                        'Do not assign "getState" directly. Always use strongly typed selector, because geState is typed as "any" and it\'s dangerous to use it directly.',
                    selector:
                        "VariableDeclarator[init.type='CallExpression']:matches([init.callee.name='getState'])",
                },
                {
                    message:
                        'Please don\'t use "state" directly because it\'s typed as "any". Always use it only as parameter for strongly typed selector function.',
                    selector:
                        "CallExpression[callee.name='useSelector'] MemberExpression[object.name='state']:matches([property.type='Identifier'])",
                },
                {
                    message:
                        'Use Array/String .includes() instead of .indexOf() comparison (e.g. `arr.indexOf(x) >= 0` → `arr.includes(x)`, `arr.indexOf(x) === -1` → `!arr.includes(x)`).',
                    selector:
                        "BinaryExpression[left.type='CallExpression'][left.callee.type='MemberExpression'][left.callee.property.name='indexOf']:matches([operator='>='][right.value=0], [operator='<'][right.value=0], [operator='>'][right.type='UnaryExpression'][right.operator='-'][right.argument.value=1], [operator='==='][right.type='UnaryExpression'][right.operator='-'][right.argument.value=1], [operator='!=='][right.type='UnaryExpression'][right.operator='-'][right.argument.value=1], [operator='=='][right.type='UnaryExpression'][right.operator='-'][right.argument.value=1], [operator='!='][right.type='UnaryExpression'][right.operator='-'][right.argument.value=1])",
                },
            ],
            'object-shorthand': [
                'error',
                'always',
                {
                    ignoreConstructors: false,
                    avoidQuotes: true,
                },
            ],
            'no-useless-rename': [
                'error',
                {
                    ignoreDestructuring: false,
                    ignoreImport: false,
                    ignoreExport: false,
                },
            ],
            'prefer-numeric-literals': 'error',
            'padding-line-between-statements': [
                'error', // Todo: deprecated, use @stylistic/eslint-plugin-js instead
                { blankLine: 'always', prev: '*', next: 'return' },
            ],

            // Offs
            'no-undef': 'off', // Todo: write description

            // Offs for Node.js
            'no-sync': 'off', // disallow use of synchronous methods (off by default)
            'no-process-exit': 'off', // disallow process.exit() (on by default in the node environment)
        },
    },
    {
        files: ['**/*.js'], // Usually config files
        rules: {
            'no-console': 'off',
        },
    },
];
