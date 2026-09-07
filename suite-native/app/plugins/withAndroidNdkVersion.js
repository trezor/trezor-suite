const { CodeGenerator, withProjectBuildGradle } = require('expo/config-plugins');

module.exports = config =>
    withProjectBuildGradle(config, configWithGradle => {
        configWithGradle.modResults.contents = CodeGenerator.mergeContents({
            src: configWithGradle.modResults.contents,
            tag: 'android-ndk-version',
            anchor: /apply plugin: ["']expo-root-project["']/,
            offset: 1,
            comment: '//',
            // Modules without an explicit NDK otherwise fall back to AGP's older default.
            newSrc: `subprojects { subproject ->
  ["com.android.application", "com.android.library"].each { pluginId ->
    subproject.plugins.withId(pluginId) {
      subproject.androidComponents.finalizeDsl { android ->
        android.ndkVersion = rootProject.ext.ndkVersion
      }
    }
  }
}`,
        }).contents;

        return configWithGradle;
    });
