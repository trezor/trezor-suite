#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const defaultAndroidABIs = ['armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'];
const androidLibraryName = 'libreact_native_haskell_shelley.so';
const iosLibraryName = 'libreact_native_haskell_shelley.a';
const cslHeaderName = 'react_native_haskell_shelley.h';

const appRoot = path.resolve(__dirname, '..');
const cardanoLibrariesRoot = path.join(appRoot, 'native-libs', 'cardano');
const cslHeaderPath = path.join(cardanoLibrariesRoot, 'include', cslHeaderName);

const isLFSPointer = filePath => {
    if (!fs.existsSync(filePath)) {
        return false;
    }

    const fileDescriptor = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(128);
    const bytesRead = fs.readSync(fileDescriptor, buffer, 0, buffer.length, 0);
    fs.closeSync(fileDescriptor);
    const header = buffer.toString('utf8', 0, bytesRead);

    return header.startsWith('version https://git-lfs.github.com/spec/v1');
};

const getRequestedAndroidABIs = () => {
    const requestedABIs = (process.env.CARDANO_ANDROID_ABIS || defaultAndroidABIs.join(','))
        .split(',')
        .map(abi => abi.trim())
        .filter(Boolean);

    if (requestedABIs.length === 0) {
        throw new Error('CARDANO_ANDROID_ABIS must contain at least one ABI.');
    }

    const unsupportedABIs = requestedABIs.filter(abi => !defaultAndroidABIs.includes(abi));

    if (unsupportedABIs.length > 0) {
        throw new Error(`Unsupported Cardano Android ABI: ${unsupportedABIs.join(', ')}`);
    }

    return requestedABIs;
};

const ensureArtifacts = filePaths => {
    for (const filePath of filePaths) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`Missing Cardano native artifact: ${filePath}`);
        }

        if (isLFSPointer(filePath)) {
            throw new Error(`Cardano native artifact is still a Git LFS pointer: ${filePath}`);
        }
    }
};

const copyFile = (sourcePath, destinationPath) => {
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    fs.copyFileSync(sourcePath, destinationPath);
};

const copyArtifacts = copyPlan => {
    ensureArtifacts(copyPlan.map(({ sourcePath }) => sourcePath));

    for (const { sourcePath, destinationPath } of copyPlan) {
        copyFile(sourcePath, destinationPath);
    }
};

const getBridgeRoot = () => {
    const packageJsonPath = require.resolve('@emurgo/csl-mobile-bridge/package.json', {
        paths: [appRoot],
    });

    return path.dirname(packageJsonPath);
};

const prepareAndroid = () => {
    const bridgeRoot = getBridgeRoot();
    const requestedAndroidABIs = getRequestedAndroidABIs();
    const androidJniLibsRoot = path.join(bridgeRoot, 'android', 'build', 'rustJniLibs', 'android');

    fs.rmSync(androidJniLibsRoot, { recursive: true, force: true });

    copyArtifacts([
        {
            sourcePath: cslHeaderPath,
            destinationPath: path.join(bridgeRoot, 'rust', 'include', cslHeaderName),
        },
        ...requestedAndroidABIs.map(abi => ({
            sourcePath: path.join(cardanoLibrariesRoot, 'android', abi, androidLibraryName),
            destinationPath: path.join(androidJniLibsRoot, abi, androidLibraryName),
        })),
    ]);
};

const prepareIOS = () => {
    const configurationBuildDir = process.env.CONFIGURATION_BUILD_DIR;

    if (!configurationBuildDir) {
        throw new Error('CONFIGURATION_BUILD_DIR is required to prepare Cardano iOS artifacts.');
    }

    const isSimulator =
        process.env.PLATFORM_NAME === 'iphonesimulator' ||
        process.env.EFFECTIVE_PLATFORM_NAME === '-iphonesimulator';
    const sourceLibraryName = isSimulator
        ? 'libreact_native_haskell_shelley_simulator.a'
        : iosLibraryName;
    const sourceLibraryPath = path.join(cardanoLibrariesRoot, 'ios', sourceLibraryName);

    copyArtifacts([
        {
            sourcePath: sourceLibraryPath,
            destinationPath: path.join(configurationBuildDir, iosLibraryName),
        },
        {
            sourcePath: cslHeaderPath,
            destinationPath: path.join(configurationBuildDir, cslHeaderName),
        },
    ]);
};

const platform = process.argv[2];

if (platform === 'android') {
    prepareAndroid();
} else if (platform === 'ios') {
    prepareIOS();
} else {
    throw new Error('Usage: prepareCardanoNativeBridge.js <android|ios>');
}
