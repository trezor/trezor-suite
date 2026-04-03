/**
 * Autolinking config for @suite-native/react-native-cardano.
 *
 * This package wraps @emurgo/csl-mobile-bridge with pre-compiled Rust binaries
 * so developers don't need a Rust toolchain. Source files (C++, ObjC++)
 * are referenced from node_modules/@emurgo/csl-mobile-bridge/.
 *
 * iOS: podspec auto-discovered at package root (ReactNativeCardano.podspec).
 * Android: build.gradle packages jniLibs; C++ TurboModule via cxxModuleProvider.
 */
module.exports = {
    dependency: {
        platforms: {
            android: {
                sourceDir: 'android',
                packageImportPath: 'import com.emurgo.cslmobilebridge.CslMobileBridgePackage;',
                packageInstance: 'new CslMobileBridgePackage()',
                cxxModuleCMakeListsModuleName: 'csl_mobile_bridge_jsi',
                cxxModuleCMakeListsPath: 'CMakeLists.txt',
                cxxModuleHeaderName: 'NativeCslMobileBridgeModule',
            },
        },
    },
};
