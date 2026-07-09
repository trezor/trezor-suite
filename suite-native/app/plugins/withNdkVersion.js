const { withProjectBuildGradle } = require('expo/config-plugins');

const generatedBlockStart = '// @generated begin suite-native-ndk-version';
const generatedBlockEnd = '// @generated end suite-native-ndk-version';

module.exports = function withNdkVersion(config, { ndkVersion }) {
    return withProjectBuildGradle(config, config2 => {
        const ndkVersionBlock = `${generatedBlockStart}
allprojects { ext.ndkVersion = "${ndkVersion}" }
${generatedBlockEnd}
`;

        if (config2.modResults.contents.includes(generatedBlockStart)) {
            config2.modResults.contents = config2.modResults.contents.replace(
                new RegExp(`${generatedBlockStart}[\\s\\S]*?${generatedBlockEnd}\\n?`),
                ndkVersionBlock,
            );
        } else {
            config2.modResults.contents = `${ndkVersionBlock}\n${config2.modResults.contents}`;
        }

        return config2;
    });
};
