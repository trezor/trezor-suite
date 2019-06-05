module.exports = api => {
    api.cache(true);
    return {
        presets: ['module:metro-react-native-babel-preset'],
        plugins: [
            [
                'module-resolver',
                {
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
                    },
                },
            ],
        ],
    };
};
