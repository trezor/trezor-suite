const { notarize } = require('electron-notarize');
const pkg = require('../package.json');

exports.default = function notarizing(context) {
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
