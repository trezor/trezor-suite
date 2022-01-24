module.exports = {
    extends: '../../.eslintrc.js',
    overrides: [
        {
            files: ['*.ts', '*.tsx'],
            parserOptions: {
                project: ['./tsconfig.json'],
            },
            excludedFiles: ['src/**/*.js'],
        },
    ],
    parser: '@typescript-eslint/parser',
};
