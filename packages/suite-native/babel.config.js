const fs = require('fs');

fs.writeFileSync('./a', '1');
const pwd = process.env.PWD;
console.log('pwd ============================= pwd', pwd);

module.exports = api => {
    const pwd = process.env.PWD;
    console.log('pwd ============================= pwd', pwd);
    api.cache(true);
    return {
        presets: ['module:metro-react-native-babel-preset'],
        plugins: [
            [
                'module-resolver',
                {
                    extensions: ['.js', '.ios.js', '.android.js', '.json'],
                    // root: ['../../'],
                    resolvePath(sourcePath, currentFile, opts) {
                        /**
                         * The `opts` argument is the options object that is passed through the Babel config.
                         * opts = {
                         *   extensions: [".js"],
                         *   resolvePath: ...,
                         * }
                         */
                        console.log('sourcePath', sourcePath);
                        console.log('currentFile', currentFile);

                        return 'kurwa-drat-xxx';
                    },
                    alias: {
                        // TODO: alias for routerActions could be removed
                        // since it will be handled with resolver for custom .useNative extension
                        // (after renaming routerActions.ts to routerActions.useNative.ts in suite folder)
                        '^@suite/actions/routerActions$':
                            './packages/suite-native/src/actions/routerActions',
                        '^@suite/actions/(.+).useNative$':
                            './packages/suite-native/src/actions/\\1', // every action file in suite/actions with .useNative extension will be replaced by a file in suite-native/actions directory
                        '^@suite/(.+)': './packages/suite/src/\\1', // relative to "projectRoot: ../../" defined in package.json
                        'node-fetch': 'whatwg-fetch',
                        '^@(.+)-views/(.+)': './packages/suite/src/views/\\1/\\2',
                        '^@(.+)-views': './packages/suite/src/views/\\1/index',
                        '^@(.+)-components/(.+)': './packages/suite/src/components/\\1/\\2',
                        '^@(.+)-components': './packages/suite/src/components/\\1/index',
                        '^@(.+)-actions/(.+)': './packages/suite/src/actions/\\1/\\2',
                        '^@(.+)-actions': './packages/suite/src/actions/\\1/index',
                        '^@(.+)-reducers/(.+)': './packages/suite/src/reducers/\\1/\\2',
                        '^@(.+)-reducers': './packages/suite/src/reducers/\\1/index',
                        '^@(.+)-config/(.+)': './packages/suite/src/config/\\1/\\2',
                        '^@(.+)-config': './packages/suite/src/config/\\1/index',
                        '^@(.+)-constants/(.+)': './packages/suite/src/constants/\\1/\\2',
                        '^@(.+)-constants': './packages/suite/src/constants/\\1/index',
                        '^@(.+)-support/(.+)': './packages/suite/src/support/\\1/\\2',
                        '^@(.+)-support': './packages/suite/src/support/\\1/index',
                        '^@(.+)-utils/(.+)': './packages/suite/src/utils/\\1/\\2',
                        '^@(.+)-utils': './packages/suite/src/utils/\\1/index',
                        '^@(.+)-types/(.+)': './packages/suite/src/types/\\1/\\2',
                        '^@(.+)-types': './packages/suite/src/types/\\1/index',
                        '^@(.+)-middlewares/(.+)': './packages/suite/src/middlewares/\\1/\\2',
                        '^@(.+)-middlewares': './packages/suite/src/middlewares/\\1/index',
                        '^@trezor/components$': './packages/components',
                        '^@trezor/suite-data$': './packages/suite-data',
                        '^@trezor/blockchain-link$': './packages/blockchain-link',
                    },
                },
            ],
        ],
    };
};
