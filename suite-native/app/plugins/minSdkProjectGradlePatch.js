const { withProjectBuildGradle } = require('@expo/config-plugins');
const generateCode = require('@expo/config-plugins/build/utils/generateCode');

// https://github.com/expo/expo/issues/36461#issuecomment-2846152663
const minSdkPatchCode = `
  ext {
    buildToolsVersion = findProperty('android.buildToolsVersion') ?: '35.0.0'
    minSdkVersion = Integer.parseInt(findProperty('android.minSdkVersion') ?: '24')
    compileSdkVersion = Integer.parseInt(findProperty('android.compileSdkVersion') ?: '35')
    targetSdkVersion = Integer.parseInt(findProperty('android.targetSdkVersion') ?: '34')
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
