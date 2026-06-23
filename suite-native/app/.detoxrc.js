/** @type {Detox.DetoxConfig} */
module.exports = {
    session: {
        debugSynchronization: 30_000,
    },
    testRunner: {
        args: {
            $0: 'jest',
            config: 'e2e/jest.config.js',
        },
        jest: {
            setupTimeout: 120_000,
        },
    },
    apps: {
        'ios.debug': {
            type: 'ios.app',
            binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/TrezorSuiteDebug.app',
            build: 'NODE_ENV=test xcodebuild -workspace ios/TrezorSuiteDebug.xcworkspace -scheme TrezorSuiteDebug -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
        },
        'ios.release': {
            type: 'ios.app',
            binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/TrezorSuiteDebug.app',
            build: 'NODE_ENV=test xcodebuild -workspace ios/TrezorSuiteDebug.xcworkspace -scheme TrezorSuiteDebug -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
        },
        'android.debug': {
            type: 'android.apk',
            binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
            build: 'cd android && NODE_ENV=test ./gradlew :app:assembleDebug :app:assembleAndroidTest -DtestBuildType=debug',
            reversePorts: [8081, 21328, 19121],
        },
        'android.release': {
            type: 'android.apk',
            binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
            build: 'cd android && NODE_ENV=test ./gradlew :app:assembleRelease :app:assembleAndroidTest -DtestBuildType=release',
            reversePorts: [21328, 19121],
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
                avdName: 'Pixel_6_API_34',
            },
            bootArgs: '-no-metrics',
        },
        // arm64 AVD for Apple Silicon (M-series) Macs — avoids the BAMPerfProfiler
        // segfault that occurs when Flashlight runs on an x86_64 emulator with arm64
        // ABI translation. Create once with:
        //   sdkmanager "system-images;android-34;google_apis;arm64-v8a"
        //   avdmanager create avd -n Pixel_6_API_34_arm64 \
        //     -k "system-images;android-34;google_apis;arm64-v8a" -d pixel_6
        'emulator-arm64': {
            type: 'android.emulator',
            device: {
                avdName: 'Pixel_6_API_34_arm64',
            },
            bootArgs: '-no-metrics',
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
        'android.emu.debug.arm64': {
            device: 'emulator-arm64',
            app: 'android.debug',
        },
        'android.emu.release.arm64': {
            device: 'emulator-arm64',
            app: 'android.release',
        },
    },
    artifacts: {
        rootDir: 'artifacts',
        keepPrevious: false,
        plugins: {
            log: { enabled: true }, // device/simulator logs
            screenshot: {
                enabled: true,
                shouldTakeAutomaticSnapshots: 'all',
                keepOnlyFailedTestsArtifacts: false,
            },
            video: {
                enabled: true,
                keepOnlyFailedTestsArtifacts: false,
            },
            uiHierarchy: {
                enabled: true,
                keepOnlyFailedTestsArtifacts: false,
            },
        },
    },
};
