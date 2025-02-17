import { notarize } from '@electron/notarize';
import type { Hooks } from 'app-builder-lib';

const notarizeAfterSignHook: Hooks['afterSign'] = context => {
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
        tool: 'notarytool',
        appBundleId: 'io.trezor.TrezorSuite',
        appPath,
        appleId: process.env.APPLEID,
        appleIdPassword: process.env.APPLEIDPASS,
        teamId: process.env.APPLETEAMID,
        // TODO fix: notarize tool is known to be working, but TS fails: no overload matches this call
    } as any);
};

export default notarizeAfterSignHook;
