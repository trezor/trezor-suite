module.exports = {
    extends: '../../.eslintrc.js',
    rules: {
        'jsx-a11y/click-events-have-key-events': 'off',
        'jsx-a11y/no-static-element-interactions': 'off'
    },
    parserOptions: {
        project: ['./tsconfig.json'],
    },
};
