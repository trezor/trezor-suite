module.exports = {
    extends: ['../suite/.eslintrc.js'],
    parserOptions: {
        project: ['./tsconfig.json', './test/tsconfig.json'],
    },
};
