export const knipConfig = {
    entry: [
        'knip.ts',
        '.detoxrc.js',
        'app.config.ts',
        'babel.config.js',
        'e2e/jest.config.js',
        'e2e/trezorDetoxRunner/config/*.js',
        'e2e/trezorDetoxRunner/index.ts',
        'jest.config.js',
    ],
    metro: false,
};
