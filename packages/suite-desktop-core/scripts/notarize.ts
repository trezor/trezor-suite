import { notarize } from '@electron/notarize';
import type { Hooks } from 'app-builder-lib';

export const notarizeAfterSignHook: Hooks['afterSign'] = context => {
    const { electronPlatformName, appOutDir } = context;

    if (electronPlatformName !== 'darwin') {
        return;
    }

    if (!process.env.APPLEID || !process.env.APPLEIDPASS || !process.env.APPLETEAMID) {
        return;
    }

    const appName = context.packager.appInfo.productFilename;
    const appPath = `${appOutDir}/${appName}.app`;

    console.warn(`notarizing ${appPath} ...`);

    return notarize({
        appPath,
        appleId: process.env.APPLEID,
        appleIdPassword: process.env.APPLEIDPASS,
        teamId: process.env.APPLETEAMID,
    });
};
