const path = require('path');

module.exports = function (api) {
    api.cache(!process.env.INSTRUMENT_CODE);

    return {
        env: {
            production: {
                plugins: [['transform-remove-console', { exclude: ['error'] }]],
            },
        },
        presets: [['babel-preset-expo', { unstable_transformImportMeta: true }]],
        plugins: [
            ['@babel/plugin-transform-class-static-block'],
            ...(process.env.INSTRUMENT_CODE
                ? [
                      [
                          'istanbul',
                          {
                              cwd: path.resolve(__dirname, '../../'),
                              include: [
                                  'packages/*/src/**/*',
                                  'suite-common/*/src/**/*',
                                  'suite-native/*/src/**/*',
                              ],
                              exclude: [
                                  '**/*.test.{ts,tsx,js,jsx}',
                                  '**/*.spec.{ts,tsx,js,jsx}',
                                  '**/__tests__/**',
                                  '**/tests/**',
                                  '**/test/**',
                                  '**/e2e/**',
                              ],
                              extension: ['.js', '.jsx', '.ts', '.tsx'],
                          },
                      ],
                  ]
                : []),
            // react-native-reanimated plugin has to be listed last
            ['react-native-worklets/plugin', { globals: ['__scanCodes'] }],
        ],
    };
};
