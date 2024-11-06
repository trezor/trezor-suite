import pluginChaiFriendly from 'eslint-plugin-chai-friendly';

export const chaiFriendlyConfig = [
    {
        plugins: { 'chai-friendly': pluginChaiFriendly },
        rules: {
            'no-unused-expressions': 'off', // disable original rule
            // However this does not work for @typescript-eslint/no-unused-expressions
            // See: https://github.com/ihordiachenko/eslint-plugin-chai-friendly/issues/41
            'chai-friendly/no-unused-expressions': 'error',
        },
    },
];
