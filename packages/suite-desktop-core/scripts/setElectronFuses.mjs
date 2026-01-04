import { FuseV1Options, FuseVersion, flipFuses } from '@electron/fuses';
import path from 'node:path';
/**
 * @typedef {import('app-builder-lib').Hooks} Hooks
 */

// copied from https://github.com/electron-userland/electron-builder/blob/04be5699c664e6a93e093b820a16ad516355b5c7/packages/app-builder-lib/src/platformPackager.ts#L430-L434
/* @type {{ darwin: string, win32: string, linux: string }} */
const binaryExtensionByPlaformNameMap = {
    darwin: '.app',
    win32: '.exe',
    linux: '',
};

/** @type {Hooks['afterPack']} **/
const afterPackHookSetElectronFuses = async context => {
    const { electronPlatformName, appOutDir } = context;

    // As of Electron 39, ASAR integrity is not supported on Linux, so we set the appropriate fuses for Windows and macOS
    if (electronPlatformName !== 'win32' && electronPlatformName !== 'darwin') {
        // eslint-disable-next-line no-console
        console.log('Skipping electron fuses ');

        return;
    }

    const ext = binaryExtensionByPlaformNameMap[electronPlatformName];
    const appName = context.packager.appInfo.productFilename;
    const binaryFilename = `${appName}${ext}`;
    const binaryPath = path.join(appOutDir, binaryFilename);

    // eslint-disable-next-line no-console
    console.log(`Setting electron fuses on ${binaryPath}`);

    await flipFuses(binaryPath, {
        version: FuseVersion.V1,
        [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
        [FuseV1Options.OnlyLoadAppFromAsar]: true,
    });

    // eslint-disable-next-line no-console
    console.log('Successfully set electron fuses');
};

// eslint-disable-next-line import/no-default-export
export default afterPackHookSetElectronFuses;
