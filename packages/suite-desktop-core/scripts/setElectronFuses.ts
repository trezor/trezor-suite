import { FuseV1Options, FuseVersion, flipFuses } from '@electron/fuses';
import type { Hooks } from 'app-builder-lib';
import path from 'node:path';

// copied from https://github.com/electron-userland/electron-builder/blob/04be5699c664e6a93e093b820a16ad516355b5c7/packages/app-builder-lib/src/platformPackager.ts#L430-L434
const binaryExtensionByPlaformNameMap = {
    darwin: '.app',
    win32: '.exe',
    linux: '',
} as const;

const afterPackHookSetElectronFuses: Hooks['afterPack'] = async context => {
    const { electronPlatformName, appOutDir } = context;

    /*
     As of Electron 34.1.0, ASAR integrity:
     - is not supported on Linux at all
     - is supported on macOS, but does not work. TODO investigate & reenable
     So we only set the appropriate fuses for Windows
    */
    if (electronPlatformName !== 'win32') {
        console.log('Skipping electron fuses ');

        return;
    }

    const ext = binaryExtensionByPlaformNameMap[electronPlatformName];
    const appName = context.packager.appInfo.productFilename;
    const binaryFilename = `${appName}${ext}`;
    const binaryPath = path.join(appOutDir, binaryFilename);

    console.log(`Setting electron fuses on ${binaryPath}`);

    await flipFuses(binaryPath, {
        version: FuseVersion.V1,
        [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
        [FuseV1Options.OnlyLoadAppFromAsar]: true,
    });

    console.log('Successfully set electron fuses');
};

export default afterPackHookSetElectronFuses;
