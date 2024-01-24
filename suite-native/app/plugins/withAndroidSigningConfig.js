/* eslint-disable @typescript-eslint/no-shadow */
/*
 * This plugin is only necessary for support of legacy fastlane setup. It must be removed once EAS is fully adopted.
 */
const { withAppBuildGradle } = require('expo/config-plugins');

const newDebugConfig = `
            storeFile file(System.getenv("SIGNING_KEY_FILE"))
            storePassword System.getenv("SIGNING_KEY_STORE_PASSWORD")
            keyAlias System.getenv("SIGNING_KEY_ALIAS")
            keyPassword System.getenv("SIGNING_KEY_PASSWORD")
`;

function updateAndroidGradleFile(contents) {
    // Replacement string
    const replacement = `signingConfigs {
        debug {${newDebugConfig}
        }`;

    // Replace the content
    const updatedGradleCode = contents.replace(
        /signingConfigs\s*{\s*debug\s*{[^}]*}/,
        replacement.trim(),
    );
    return updatedGradleCode;
}

module.exports = config =>
    withAppBuildGradle(config, config => {
        if (process.env.SIGNING_KEY_FILE) {
            config.modResults.contents = updateAndroidGradleFile(config.modResults.contents);
        }
        return config;
    });
