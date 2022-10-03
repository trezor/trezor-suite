/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-console */

const { notarize } = require('electron-notarize');

const pkg = require('../package.json');

// @ts-expect-error cannot import AfterPackContext as type using require
exports.default = context => {
    const { electronPlatformName, appOutDir } = context;

    if (electronPlatformName !== 'darwin') {
        return;
    }

    if (!process.env.APPLEID || !process.env.APPLEIDPASS) {
        return;
    }

    const appName = context.packager.appInfo.productFilename;
    const appPath = `${appOutDir}/${appName}.app`;

    console.log(`notarizing ${appPath} ...`);

    return notarize({
        appBundleId: pkg.build.appId,
        appPath,
        appleId: process.env.APPLEID,
        appleIdPassword: process.env.APPLEIDPASS,
    });
};
