const { CodeGenerator, withProjectBuildGradle } = require('expo/config-plugins');

module.exports = config =>
    withProjectBuildGradle(config, configWithGradle => {
        configWithGradle.modResults.contents = CodeGenerator.mergeContents({
            src: configWithGradle.modResults.contents,
            tag: 'android-ndk-version',
            anchor: /apply plugin: ["']expo-root-project["']/,
            offset: 1,
            comment: '//',
            // These modules omit ndkVersion and fall back to AGP's older default.
            // Keep the exception scoped so other dependencies retain their own NDK settings.
            newSrc: `subprojects { subproject ->
  if (subproject.name in ["expo-sqlite", "expo-updates", "sentry_react-native"]) {
    subproject.plugins.withId("com.android.library") {
      subproject.androidComponents.finalizeDsl { android ->
        android.ndkVersion = rootProject.ext.ndkVersion
      }
    }
  }
}`,
        }).contents;

        return configWithGradle;
    });
