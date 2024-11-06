import pluginJest from 'eslint-plugin-jest';

export const jestConfig = [
    pluginJest.configs['flat/recommended'],
    {
        rules: {
            // Additions
            // Enforce arrow functions only is afaik not possible. But this helps.
            'func-style': ['error', 'declaration', { allowArrowFunctions: true }],

            // Offs
            'jest/valid-title': 'off', // This rule does not use Typescript and produces false positives
            'jest/valid-describe-callback': 'off', // This rule does not use Typescript and produces false positives
            'jest/no-disabled-tests': 'off',
            'jest/no-conditional-expect': 'off', // Todo: we shall solve this, this is bad practice
            'jest/expect-expect': 'off', // Todo: we have test with no assertions, this may be legit but it needs to be checked
        },
    },
];
