const { withProjectBuildGradle } = require('expo/config-plugins');

module.exports = function withNdkVersion(config, { ndkVersion }) {
    return withProjectBuildGradle(config, modConfig => {
        let { contents } = modConfig.modResults;

        const ndkBlock = `// Custom NDK Version\nallprojects { ext.ndkVersion = "${ndkVersion}" }\n`;

        if (contents.includes('ext.ndkVersion')) {
            contents = contents.replace(
                /ext\.ndkVersion\s*=\s*["'].*["']/,
                `ext.ndkVersion = "${ndkVersion}"`,
            );
        } else {
            contents = ndkBlock + contents;
        }

        modConfig.modResults.contents = contents;

        console.log(`[withNdkVersion] Applied NDK: ${ndkVersion}`);

        return modConfig;
    });
};
