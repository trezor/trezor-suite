module.exports = api => {
    // The cache only affects in-memory configuration. If you've restarted the process, it'll always call the function at least once.
    api.cache(true);
    const plugins = [
        [
            'module-resolver',
            {
                alias: {
                    '^@suite-web-landing-components/(.+)': '../../packages/suite-web-landing/components/\\1/\\2',
                    '^@suite-web-landing-components': '../../packages/suite-web-landing/components/\\1/index',
                    '^@landing-components/(.+)': '../../packages/landing-page/components/\\1/\\2',
                    '^@landing-components': '../../packages/landing-page/components/\\1/index',
                    '^@(.+)-components/(.+)': '../../packages/suite/src/components/\\1/\\2',
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
