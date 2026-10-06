import { FuseV1Options, FuseVersion, flipFuses } from '@electron/fuses';
import path from 'node:path';
/**
 * @typedef {import('app-builder-lib').Hooks} Hooks
 * @typedef {'darwin' | 'win32' | 'linux'} SupportedPlatformName
 */

/** @type {readonly SupportedPlatformName[]} */
const supportedPlatformNames = ['darwin', 'win32', 'linux'];

/**
 * @param {string} platformName
 * @returns {platformName is SupportedPlatformName}
 */
const isSupportedPlatformName = platformName =>
    supportedPlatformNames.includes(/** @type {SupportedPlatformName} */ (platformName));

// copied from https://github.com/electron-userland/electron-builder/blob/04be5699c664e6a93e093b820a16ad516355b5c7/packages/app-builder-lib/src/platformPackager.ts#L430-L434
/* @type {{ darwin: string, win32: string, linux: string }} */
const binaryExtensionByPlatformNameMap = {
    darwin: '.app',
    win32: '.exe',
    linux: '',
};

const fusesToFlipByPlatformNameMap = {
    darwin: {
        [FuseV1Options.RunAsNode]: false,
        [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
        [FuseV1Options.OnlyLoadAppFromAsar]: true,
    },
    win32: {
        [FuseV1Options.RunAsNode]: false,
        [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
        [FuseV1Options.OnlyLoadAppFromAsar]: true,
    },
    // As of Electron 39, ASAR integrity is not supported on Linux
    linux: {
        [FuseV1Options.RunAsNode]: false,
    },
};

/** @type {Hooks['afterPack']} **/
const afterPackHookSetElectronFuses = async context => {
    const { electronPlatformName, appOutDir } = context;

    if (!isSupportedPlatformName(electronPlatformName)) {
        console.warn('Skipping electron fuses (unknown platform).');

        return;
    }
    const fusesToFlip = fusesToFlipByPlatformNameMap[electronPlatformName];
    const ext = binaryExtensionByPlatformNameMap[electronPlatformName];
    const appName = context.packager.appInfo.productFilename;
    const binaryFilename = `${appName}${ext}`;
    const binaryPath = path.join(appOutDir, binaryFilename);

    console.info(`Setting electron fuses on ${binaryPath}`);

    await flipFuses(binaryPath, {
        version: FuseVersion.V1,
        ...fusesToFlip,
    });

    console.info('Successfully set electron fuses');
};

// eslint-disable-next-line import/no-default-export
export default afterPackHookSetElectronFuses;
