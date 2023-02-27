module.exports = {
    // lot of rules are disabled because this is lib is copy pasted form source and use different code style
    rules: {
        // components here are from Skia which uses style in different way
        'react/style-prop-object': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
        'no-continue': 'off',
        'no-restricted-properties': 'off',
        '@typescript-eslint/no-shadow': 'off',
    },
};
