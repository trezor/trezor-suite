/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */

const { notarize } = require('@electron/notarize');

exports.default = context => {
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
    });
};
