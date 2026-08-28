import pluginJs from '@eslint/js';
/**
 * @typedef {import('eslint').Linter.Config} Config
 */

/**
 * Cast bans for the result of `Object.keys/entries/values(...) as …` — steer them to the
 * typedObject* helpers. Exported separately so packages that switch the rest of
 * `no-restricted-syntax` off can still opt back into just these selectors.
 */
export const noCastedObjectHelpersSyntax = [
    {
        selector:
            "TSAsExpression[expression.type='CallExpression'][expression.callee.type='MemberExpression'][expression.callee.object.name='Object'][expression.callee.property.name='keys']",
        message:
            'Use typedObjectKeys from @trezor/utils instead of casting the result of Object.keys(). The `as` assertion just re-spells `keyof typeof`, which typedObjectKeys provides safely.',
    },
    {
        selector:
            "TSAsExpression[expression.type='CallExpression'][expression.callee.type='MemberExpression'][expression.callee.object.name='Object'][expression.callee.property.name='entries']",
        message:
            'Use typedObjectEntries from @trezor/utils instead of casting the result of Object.entries(). The `as` assertion just re-spells the entry tuple type, which typedObjectEntries provides safely.',
    },
    {
        selector:
            "TSAsExpression[expression.type='CallExpression'][expression.callee.type='MemberExpression'][expression.callee.object.name='Object'][expression.callee.property.name='values']",
        message:
            'Use typedObjectValues from @trezor/utils instead of casting the result of Object.values(). The `as` assertion just re-spells the value type, which typedObjectValues provides safely.',
    },
];

/**
 * Base `no-restricted-syntax` selectors. Exported so configs that add their own selectors can
 * spread these back in — the rule's options are replaced, not merged, when it is re-declared.
 */
export const noRestrictedSyntax = [
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
            'Do not assign "getState" directly. Always use strongly typed selector, because getState is typed as "any" and it\'s dangerous to use it directly.',
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
    {
        selector: "TSTypeQuery > Identifier[name='undefined']",
        message:
            'Use `undefined` (or `never` in discriminated unions) instead of `typeof undefined` in type position.',
    },
    ...noCastedObjectHelpersSyntax,
];

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
            'no-restricted-syntax': ['error', ...noRestrictedSyntax],
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
