/**
 * Exclude @emurgo/csl-mobile-bridge from native autolinking.
 *
 * csl-mobile-bridge is a dependency of @suite-native/react-native-cardano (for JS code + types),
 * but its native build requires Rust. We ship pre-compiled binaries instead via
 * @suite-native/react-native-cardano, which registers the same 'CslMobileBridge' TurboModule.
 */
module.exports = {
    dependencies: {
        '@emurgo/csl-mobile-bridge': {
            platforms: { ios: null, android: null },
        },
    },
};
