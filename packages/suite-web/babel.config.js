module.exports = api => {
    // The cache only affects in-memory configuration. If you've restarted the process, it'll always call the function at least once.
    api.cache(true);
    const plugins = [
        [
            'module-resolver',
            {
                alias: {
                    '^react-native$': 'react-native-web',
                    '^@suite/(.+)': '../../packages/suite/src/\\1',
                    '^@(.+)-views/(.+)': '../../packages/suite/src/views/\\1/\\2',
                    '^@(.+)-views': '../../packages/suite/src/views/\\1/index',
                    '^@(.+)-components/(.+)': '../../packages/suite/src/components/\\1/\\2',
                    '^@(.+)-components': '../../packages/suite/src/components/\\1/index',
                    '^@(.+)-actions/(.+)': '../../packages/suite/src/actions/\\1/\\2',
                    '^@(.+)-actions': '../../packages/suite/src/actions/\\1/index',
                    '^@(.+)-reducers/(.+)': '../../packages/suite/src/reducers/\\1/\\2',
                    '^@(.+)-reducers': '../../packages/suite/src/reducers/\\1/index',
                    '^@(.+)-config/(.+)': '../../packages/suite/src/config/\\1/\\2',
                    '^@(.+)-config': '../../packages/suite/src/config/\\1/index',
                    '^@(.+)-constants/(.+)': '../../packages/suite/src/constants/\\1/\\2',
                    '^@(.+)-constants': '../../packages/suite/src/constants/\\1/index',
                    '^@(.+)-support/(.+)': '../../packages/suite/src/support/\\1/\\2',
                    '^@(.+)-support': '../../packages/suite/src/support/\\1/index',
                    '^@(.+)-utils/(.+)': '../../packages/suite/src/utils/\\1/\\2',
                    '^@(.+)-utils': '../../packages/suite/src/utils/\\1/index',
                    '^@(.+)-types/(.+)': '../../packages/suite/src/types/\\1/\\2',
                    '^@(.+)-types': '../../packages/suite/src/types/\\1/index',
                    '^@(.+)-middlewares/(.+)': '../../packages/suite/src/middlewares/\\1/\\2',
                    '^@(.+)-middlewares': '../../packages/suite/src/middlewares/\\1/index',
                    '^@(.+)-hooks/(.+)': '../../packages/suite/src/hooks/\\1/\\2',
                    '^@(.+)-hooks': '../../packages/suite/src/hooks/\\1/index',
                },
            },
        ],
        [
            'babel-plugin-styled-components',
            {
                ssr: true,
                displayName: true,
                preprocess: false,
            },
        ],
    ];

    return {
        presets: ['next/babel'],
        plugins,
    };
};
