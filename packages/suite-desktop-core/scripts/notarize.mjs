import { notarize } from '@electron/notarize';
/**
 * @typedef {import('app-builder-lib').Hooks} Hooks
 */

/** @type {Hooks['afterSign']} **/
const notarizeAfterSignHook = context => {
    const { electronPlatformName, appOutDir } = context;

    if (electronPlatformName !== 'darwin') {
        return;
    }

    if (!process.env.APPLEID || !process.env.APPLEIDPASS || !process.env.APPLETEAMID) {
        return;
    }

    const appName = context.packager.appInfo.productFilename;
    const appPath = `${appOutDir}/${appName}.app`;

    console.log(`notarizing ${appPath} ...`);

    return notarize({
        appPath,
        appleId: process.env.APPLEID,
        appleIdPassword: process.env.APPLEIDPASS,
        teamId: process.env.APPLETEAMID,
    });
};

export default notarizeAfterSignHook;
