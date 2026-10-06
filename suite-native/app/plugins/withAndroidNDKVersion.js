const { withProjectBuildGradle } = require('expo/config-plugins');

const gradleConfiguration = "apply from: new File(rootDir, '../plugins/androidNDKVersion.gradle')";

module.exports = config =>
    withProjectBuildGradle(config, config2 => {
        if (!config2.modResults.contents.includes(gradleConfiguration)) {
            config2.modResults.contents += `\n${gradleConfiguration}\n`;
        }

        return config2;
    });
