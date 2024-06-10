/** @type {Detox.DetoxConfig} */
module.exports = {
    testRunner: {
        args: {
            $0: 'jest',
            config: 'e2e/jest.config.js',
        },
        jest: {
            setupTimeout: 120000,
        },
    },
    apps: {
        'ios.debug': {
            type: 'ios.app',
            binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/TrezorSuiteLiteDebug.app',
            build: 'IS_DETOX_BUILD=true xcodebuild -workspace ios/TrezorSuiteLiteDebug.xcworkspace -scheme TrezorSuiteLiteDebug -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
        },
        'ios.release': {
            type: 'ios.app',
            binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/TrezorSuiteLiteDebug.app',
            build: 'IS_DETOX_BUILD=true xcodebuild -workspace ios/TrezorSuiteLiteDebug.xcworkspace -scheme TrezorSuiteLiteDebug -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
        },
        'android.debug': {
            type: 'android.apk',
            binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
            build: 'cd android && IS_DETOX_BUILD=true ./gradlew :app:assembleDebug :app:assembleAndroidTest -DtestBuildType=debug',
            reversePorts: [8081, 21325, 19121],
        },
        'android.release': {
            type: 'android.apk',
            binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
            build: 'cd android && IS_DETOX_BUILD=true ./gradlew :app:assembleRelease :app:assembleAndroidTest -DtestBuildType=release',
            reversePorts: [21325, 19121],
        },
    },
    devices: {
        simulator: {
            type: 'ios.simulator',
            device: {
                type: 'iPhone 11',
            },
        },
        emulator: {
            type: 'android.emulator',
            device: {
                avdName: 'Pixel_3a_API_31',
            },
        },
    },
    configurations: {
        'ios.sim.debug': {
            device: 'simulator',
            app: 'ios.debug',
        },
        'ios.sim.release': {
            device: 'simulator',
            app: 'ios.release',
        },
        'android.emu.debug': {
            device: 'emulator',
            app: 'android.debug',
        },
        'android.emu.release': {
            device: 'emulator',
            app: 'android.release',
        },
    },
};
