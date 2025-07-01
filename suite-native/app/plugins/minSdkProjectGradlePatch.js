const { withProjectBuildGradle } = require('@expo/config-plugins');
const generateCode = require('@expo/config-plugins/build/utils/generateCode');

// https://github.com/expo/expo/issues/36461#issuecomment-2846152663
const minSdkPatchCode = `
  ext {
    minSdkVersion = Integer.parseInt(findProperty('android.minSdkVersion') ?: '24')
    kotlinVersion = findProperty('android.kotlinVersion') ?: '2.0.21'
  }
`;

module.exports = function withMinSdkProjectGradlePatch(config) {
    return withProjectBuildGradle(config, modConfig => {
        if (modConfig.modResults.contents.includes(minSdkPatchCode)) {
            return modConfig;
        }

        const addCode = generateCode.mergeContents({
            newSrc: minSdkPatchCode,
            tag: 'minSdkPatchCode',
            src: modConfig.modResults.contents,
            anchor: 'buildscript {',
            comment: '//',
            offset: 1,
        });

        modConfig.modResults.contents = addCode.contents;

        console.log('[minSdkProjectGradlePatch] Gradle patch applied successfully!');

        return modConfig;
    });
};
