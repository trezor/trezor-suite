#!/usr/bin/env node

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const appRoot = path.resolve(__dirname, '..');
const bridgeRoot = path.dirname(
    require.resolve('@emurgo/csl-mobile-bridge/package.json', {
        paths: [appRoot],
    }),
);
const rustRoot = path.join(bridgeRoot, 'rust');
const cardanoLibrariesRoot = path.join(appRoot, 'native-libs', 'cardano');
const androidAPILevel = '24';

const androidLibraryName = 'libreact_native_haskell_shelley.so';
const iosLibraryName = 'libreact_native_haskell_shelley.a';
const iosSimulatorLibraryName = 'libreact_native_haskell_shelley_simulator.a';
const headerName = 'react_native_haskell_shelley.h';

const androidTargets = [
    {
        abi: 'armeabi-v7a',
        rustTarget: 'armv7-linux-androideabi',
        linkerPrefix: 'armv7a-linux-androideabi',
    },
    {
        abi: 'arm64-v8a',
        rustTarget: 'aarch64-linux-android',
        linkerPrefix: 'aarch64-linux-android',
    },
    {
        abi: 'x86',
        rustTarget: 'i686-linux-android',
        linkerPrefix: 'i686-linux-android',
    },
    {
        abi: 'x86_64',
        rustTarget: 'x86_64-linux-android',
        linkerPrefix: 'x86_64-linux-android',
    },
];

const iosDeviceTarget = 'aarch64-apple-ios';
const iosSimulatorTargets = ['aarch64-apple-ios-sim', 'x86_64-apple-ios'];
const androidHostTags = {
    darwin: 'darwin-x86_64',
    linux: 'linux-x86_64',
    win32: 'windows-x86_64',
};

const usage = `Usage: generateCardanoNativeBinaries.js [android|ios|all]

Required for Android:
  ANDROID_NDK_HOME=/path/to/android/sdk/ndk/27.0.12077973`;

const getRustOutputPath = (rustTarget, libraryName) =>
    path.join(rustRoot, 'target', rustTarget, 'release', libraryName);

const getCardanoLibraryPath = (...pathParts) => path.join(cardanoLibrariesRoot, ...pathParts);

const run = (command, args, env = {}) => {
    console.log(`[cardano-native] ${command} ${args.join(' ')}`);

    execFileSync(command, args, {
        cwd: rustRoot,
        env: { ...process.env, ...env },
        stdio: 'inherit',
    });
};

const copyArtifact = (sourcePath, destinationPath) => {
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    fs.copyFileSync(sourcePath, destinationPath);
    console.log(`[cardano-native] copied ${path.relative(appRoot, destinationPath)}`);
};

const buildRustTarget = (rustTarget, env = {}) => {
    run('cargo', ['build', '--release', '--target', rustTarget], env);
};

const installRustTargets = rustTargets => run('rustup', ['target', 'add', ...rustTargets]);

const copyHeader = () =>
    copyArtifact(
        path.join(rustRoot, 'include', headerName),
        getCardanoLibraryPath('include', headerName),
    );

const getAndroidNDKHome = () => {
    const androidNDKHome = process.env.ANDROID_NDK_HOME;

    if (!androidNDKHome) {
        throw new Error(`ANDROID_NDK_HOME is required.\n\n${usage}`);
    }

    return androidNDKHome;
};

const getAndroidToolchainBin = () => {
    const androidNDKHome = getAndroidNDKHome();
    const androidHostTag = androidHostTags[process.platform];

    if (!androidHostTag) {
        throw new Error(`Unsupported Android host platform: ${process.platform}.`);
    }

    return path.join(androidNDKHome, 'toolchains', 'llvm', 'prebuilt', androidHostTag, 'bin');
};

const runFromAppRoot = (command, args) => {
    console.log(`[cardano-native] ${command} ${args.join(' ')}`);

    execFileSync(command, args, {
        cwd: appRoot,
        env: process.env,
        stdio: 'inherit',
    });
};

const stripAndroidLibrary = libraryPath => {
    const stripPath = path.join(getAndroidToolchainBin(), 'llvm-strip');

    runFromAppRoot(stripPath, ['--strip-unneeded', libraryPath]);
};

const stripIOSLibrary = libraryPath => {
    runFromAppRoot('xcrun', ['strip', '-S', libraryPath]);
};

const buildAndCopyLibrary = ({
    rustTarget,
    libraryName,
    destinationPath,
    env = {},
    stripLibrary,
}) => {
    buildRustTarget(rustTarget, env);
    copyArtifact(getRustOutputPath(rustTarget, libraryName), destinationPath);
    stripLibrary(destinationPath);
};

const getAndroidBuildEnv = (rustTarget, linkerPrefix) => {
    const toolchainBin = getAndroidToolchainBin();
    const linkerPath = path.join(toolchainBin, `${linkerPrefix}${androidAPILevel}-clang`);
    const arPath = path.join(toolchainBin, 'llvm-ar');
    const cargoTargetName = rustTarget.toUpperCase().replaceAll('-', '_');

    return {
        [`CC_${rustTarget.replaceAll('-', '_')}`]: linkerPath,
        [`AR_${rustTarget.replaceAll('-', '_')}`]: arPath,
        [`CARGO_TARGET_${cargoTargetName}_LINKER`]: linkerPath,
        [`CARGO_TARGET_${cargoTargetName}_RUSTFLAGS`]:
            '-C link-arg=-Wl,-z,max-page-size=16384 -C link-arg=-Wl,-soname,libreact_native_haskell_shelley.so',
    };
};

const buildAndroid = () => {
    installRustTargets(androidTargets.map(({ rustTarget }) => rustTarget));

    for (const { abi, rustTarget, linkerPrefix } of androidTargets) {
        buildAndCopyLibrary({
            rustTarget,
            libraryName: androidLibraryName,
            destinationPath: getCardanoLibraryPath('android', abi, androidLibraryName),
            env: getAndroidBuildEnv(rustTarget, linkerPrefix),
            stripLibrary: stripAndroidLibrary,
        });
    }

    copyHeader();
};

const buildIOS = () => {
    if (process.platform !== 'darwin') {
        throw new Error('iOS binaries can only be generated on macOS.');
    }

    installRustTargets([iosDeviceTarget, ...iosSimulatorTargets]);
    buildAndCopyLibrary({
        rustTarget: iosDeviceTarget,
        libraryName: iosLibraryName,
        destinationPath: getCardanoLibraryPath('ios', iosLibraryName),
        stripLibrary: stripIOSLibrary,
    });

    const simulatorLibraryPaths = iosSimulatorTargets.map(rustTarget => {
        buildRustTarget(rustTarget);

        return getRustOutputPath(rustTarget, iosLibraryName);
    });

    fs.mkdirSync(getCardanoLibraryPath('ios'), { recursive: true });
    run('lipo', [
        '-create',
        ...simulatorLibraryPaths,
        '-output',
        getCardanoLibraryPath('ios', iosSimulatorLibraryName),
    ]);
    stripIOSLibrary(getCardanoLibraryPath('ios', iosSimulatorLibraryName));

    copyHeader();
};

const getPlatforms = () => {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        console.log(usage);
        process.exit(0);
    }

    if (args.length === 0 || args.includes('all')) {
        return ['android', 'ios'];
    }

    if (args.some(arg => !['android', 'ios'].includes(arg))) {
        throw new Error(usage);
    }

    return args;
};

try {
    const platforms = getPlatforms();

    if (platforms.includes('android')) {
        buildAndroid();
    }

    if (platforms.includes('ios')) {
        buildIOS();
    }

    console.log('[cardano-native] done');
} catch (error) {
    console.error(`[cardano-native] ${error.message}`);
    process.exit(1);
}
