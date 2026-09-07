const { CodeGenerator, withProjectBuildGradle } = require('expo/config-plugins');

module.exports = config =>
    withProjectBuildGradle(config, configWithGradle => {
        configWithGradle.modResults.contents = CodeGenerator.mergeContents({
            src: configWithGradle.modResults.contents,
            tag: 'android-updates-architectures',
            anchor: /apply plugin: ["']expo-root-project["']/,
            offset: 1,
            comment: '//',
            // Expo Updates otherwise compiles all ABIs even for a single-architecture build.
            newSrc: `subprojects { subproject ->
  if (subproject.name == "expo-updates") {
    subproject.plugins.withId("com.android.library") {
      subproject.androidComponents.finalizeDsl { android ->
        def architectures = subproject.findProperty("reactNativeArchitectures")
        if (architectures) {
          def requestedAbis = architectures.split(",").collect { it.trim() }
          android.defaultConfig.ndk.abiFilters.clear()
          android.defaultConfig.ndk.abiFilters.addAll(requestedAbis)
          android.defaultConfig.externalNativeBuild.cmake.abiFilters.clear()
          android.defaultConfig.externalNativeBuild.cmake.abiFilters.addAll(requestedAbis)
        }
      }
    }
  }
}`,
        }).contents;

        return configWithGradle;
    });
